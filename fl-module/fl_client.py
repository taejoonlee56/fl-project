import warnings
from collections import OrderedDict
import argparse
from typing import Tuple
import flwr as fl
import torch
from fastai.vision.all import *
from fastseg import MobileV3Small
from hardware_usage_monitor import check_hardware_usage
import os
import random
import time
import gc

FL_SERVER_IP ="0.0.0.0"
FL_SERVER_PORT = 9999
SOCKET_IP = "0.0.0.0"
SOCKET_PORT = 12001
# #############################################################################
# 1. Regular PyTorch pipeline: nn.Module, train, test, and DataLoader
# #############################################################################


def label_func(fn): 
    return str(fn).replace(".png", "_label.png").replace("train", "train_label").replace("val"+folder_token, "val_label"+folder_token)

def IoU(preds, targs):
    preds = (preds.sigmoid() > 0.5).float()  # Apply the sigmoid and threshold to each channel
    preds = preds.sum(dim=1)  # Sum the binary masks
    preds = (preds > 0.5).float()  # Reapply a threshold to ensure the final mask is binary
    intersection = (preds*targs).sum()
    return intersection / ((preds+targs).sum() - intersection + 1.0)


class Net(Learner):
    """Model (simple CNN adapted from 'PyTorch: A 60 Minute Blitz')"""

    def __init__(self) -> None:
        my_get_image_files = partial(get_image_files, folders=["train", "val"])
        codes = np.array(['back', 'left','right'],dtype=str)
        
        self.model = MobileV3Small(num_classes=3, use_aspp=True, num_filters=64)
        
        NGPU = torch.cuda.device_count()
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")        
        if NGPU > 1:
            self.model = torch.nn.DataParallel(self.model, device_ids=list(range(NGPU)))
        self.model.to(device)
              
        self.carla = DataBlock(blocks=(ImageBlock, MaskBlock(codes)),
                   get_items = my_get_image_files,
                   get_y = label_func,
                   splitter = FuncSplitter(lambda x: str(x).find('validation_set')!=-1),
                   batch_tfms=aug_transforms(do_flip=False, p_affine=0, p_lighting=0.75))
        self.dls = self.carla.dataloaders(Path(DATA_DIR), path=Path("."), bs=4, num_workers=0)
        self.learn = Learner(self.dls, self.model, metrics=[DiceMulti(), foreground_acc])
        # self.learn = Learner(self.dls, self.model, metrics=JaccardCoeff())
        self.train_time = 0
        
    def train(self, epoch):
        start_time = time.time() 
        with self.learn.no_bar(), self.learn.no_mbar(), self.learn.no_logging():
            self.learn.fit_one_cycle(epoch)

        train_losses = [x[0] for x in self.learn.recorder.values]  # training loss
        valid_losses = [x[1] for x in self.learn.recorder.values]  # validation loss
        accuracies = [x[2] for x in self.learn.recorder.values]  # accuracy

        end_time = time.time()  # end time of training
        
        return train_losses[1], accuracies[1],  int(end_time - start_time)   # return training loss, validation loss, accuracy

    def test(self, epoch):
        
        start_time = time.time() 
        
        with self.learn.no_bar(), self.learn.no_mbar(), self.learn.no_logging():
            loss, _, accuracy = self.learn.validate()
            
        end_time = time.time()  # end time of training
        
        return loss, accuracy, int(end_time - start_time)


# Define Flower client
class FlowerClient(fl.client.NumPyClient):
    def __init__(self, epochs, client_model):
        self.epoch = epochs
        self.net = client_model
        self.loss_sum = 0
        
    def get_parameters(self, config):
        return [val.cpu().numpy() for _, val in self.net.learn.model.state_dict().items()]

    def set_parameters(self, parameters):
        params_dict = zip(self.net.learn.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        self.net.learn.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config) -> Tuple[List[np.ndarray], int, Dict]:
        self.set_parameters(parameters)
        loss, acc, train_time = self.net.train(epoch=self.epoch)
        cpu, ram = check_hardware_usage()
        
        return self.get_parameters(config=config), len(self.net.dls.dataset), \
            {"learning_step" : "train", "accuracy": acc, "loss":loss, "data_number" : int(self.net.dls.n),\
                "cpu": cpu, "ram" : ram, 'train_time': train_time}

    def evaluate(self, parameters, config):
        self.set_parameters(parameters)
        loss, acc, test_time = self.net.test(epoch=self.epoch)
                
        cpu, ram = check_hardware_usage()
        return loss, len(self.net.dls.valid_ds), \
            {"learning_step" : "eval", "accuracy": acc, "loss":loss, "data_number" : int(self.net.dls.n),\
                "cpu": cpu, "ram" : ram, 'train_time': test_time}
            
    def get_battery_info(self):        
        return self.battery_info

    
if __name__ == '__main__':
    
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", "--data", dest="data", action="store", required=True)          # extra value
    parser.add_argument("-e", "--epoch", dest="epoch", action="store", required=True)           # existence/nonexistence
    args = parser.parse_args()
    
        
    # Load model and data (simple CNN, CIFAR-10)
    os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
    os.environ["CUDA_VISIBLE_DEVICES"] = "0,1"

    folder_token = "\\" if platform == "win32" else "/"
    DATA_DIR = f"./{str(args.data)}"

    warnings.filterwarnings("ignore", category=UserWarning)


    net = Net()

    fl.client.start_numpy_client(
        server_address=f"{FL_SERVER_IP}:{FL_SERVER_PORT}",
        client=FlowerClient(int(args.epoch),
        client_model = net),
    )
    
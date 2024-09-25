import warnings
from collections import OrderedDict
import argparse
from typing import Tuple
import flwr as fl
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torchvision.datasets import CIFAR10
from torchvision.transforms import Compose, Normalize, ToTensor
from fastai.vision.all import *
from fastseg import MobileV3Small
from hardware_usage_monitor import check_hardware_usage

import socketio


# #############################################################################
# 1. Regular PyTorch pipeline: nn.Module, train, test, and DataLoader
# #############################################################################

def label_func(fn): 
    return str(fn).replace(".png", "_label.png").replace("train", "train_label").replace("val"+folder_token, "val_label"+folder_token)

class Net(Learner):
    """Model (simple CNN adapted from 'PyTorch: A 60 Minute Blitz')"""

    def __init__(self) -> None:
        my_get_image_files = partial(get_image_files, folders=["train", "val"])
        codes = np.array(['back', 'left','right'],dtype=str)
        
        self.model = MobileV3Small(num_classes=3, use_aspp=True, num_filters=64)
        
        NGPU = torch.cuda.device_count()
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(device)
        if NGPU > 1:
            self.model = torch.nn.DataParallel(self.model, device_ids=list(range(NGPU)))
        # torch.multiprocessing.set_start_method('spawn')
        self.model.to(device)
              
        self.carla = DataBlock(blocks=(ImageBlock, MaskBlock(codes)),
                   get_items = my_get_image_files,
                   get_y = label_func,
                   splitter = FuncSplitter(lambda x: str(x).find('validation_set')!=-1),
                   batch_tfms=aug_transforms(do_flip=False, p_affine=0, p_lighting=0.75))
        self.dls = self.carla.dataloaders(Path(DATA_DIR), path=Path("."), bs=4, num_workers=0)
        self.learn = Learner(self.dls, self.model, metrics=[DiceMulti(), foreground_acc])

    def train(self, epoch):
        with self.learn.no_bar(), self.learn.no_mbar(), self.learn.no_logging(): self.learn.fine_tune(epoch)
        
    def test(self, epoch):
        # self.learn.fine_tune(epoch)
        with self.learn.no_bar(), self.learn.no_mbar(), self.learn.no_logging():
            loss, _, accuracy = self.learn.validate()
        return loss, accuracy

# #############################################################################
# 2. Federation of the pipeline with Flower
# #############################################################################

# Load model and data (simple CNN, CIFAR-10)
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "0,1"

parser = argparse.ArgumentParser()
parser.add_argument("-d", "--data", dest="data", action="store", required=True)          # extra value
parser.add_argument("-e", "--epoch", dest="epoch", action="store", required=True)           # existence/nonexistence
args = parser.parse_args()

folder_token = "\\" if platform == "win32" else "/"
DATA_DIR = f"./{str(args.data)}"

warnings.filterwarnings("ignore", category=UserWarning)
net = Net()

# Define Flower client
class FlowerClient(fl.client.NumPyClient):
    def __init__(self, epochs):
        self.epoch = epochs
        # self.sio = socketio.Client()
        # self.sio.connect('http://localhost:8080')
        
    def get_parameters(self, config):
        return [val.cpu().numpy() for _, val in net.learn.model.state_dict().items()]

    def set_parameters(self, parameters):
        params_dict = zip(net.learn.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        net.learn.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config) -> Tuple[List[np.ndarray], int, Dict]:
        self.set_parameters(parameters)
        net.train(epoch=self.epoch)
        
        return self.get_parameters(config=config), len(net.dls.dataset), {}

    def evaluate(self, parameters, config):
        self.set_parameters(parameters)
        loss, accuracy = net.test(epoch=self.epoch)
                                
        data = {'Accuracy': accuracy, 'id' : args.data}
        json_data  = json.dumps(data)
        
        # self.sio.emit(f'get_client_acc', json_data)
        print("ACCURACY", accuracy)
        # sio.disconnect()
        
        #여기에 추가해야할듯?
        cpu, ram = check_hardware_usage()
        return loss, len(net.dls.valid_ds), {"accuracy": accuracy, "cpu": cpu, "ram" : ram}

# Start Flower client
fl.client.start_numpy_client(
    server_address="0.0.0.0:9999",
    client=FlowerClient(int(args.epoch))
)
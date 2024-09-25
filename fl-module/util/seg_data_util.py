import requests
from tqdm import tqdm
import zipfile
import shutil
import os

SEG_DATA_FOLDER = f"./data_lane_segmentation"

def mkdir_if_not_exist(path):
    if not os.path.exists(path):
        print(path)
        os.makedirs(path)

def sort_collected_data():
    """ Copy and sort content of 'data' folder into 'data_lane_segmentation' folder  """

    def is_from_valid_set(fn):
        return fn.find("validation") != -1

    x_train_dir = f"./{SEG_DATA_FOLDER}/train"
    y_train_dir = f"./{SEG_DATA_FOLDER}/train_label"
    x_valid_dir = f"./{SEG_DATA_FOLDER}/val"
    y_valid_dir = f"./{SEG_DATA_FOLDER}/val_label"

    for direc in [x_train_dir, y_train_dir, x_valid_dir, y_valid_dir]:
        mkdir_if_not_exist(direc)

    images = [x for x in os.listdir(f"./data") if x.find("png") >= 0]
    inputs = [x for x in images if x.find("label") == -1]
    labels = [x for x in images if x.find("label") != -1]

    train_x = [x for x in inputs if not is_from_valid_set(x)]
    valid_x = [x for x in inputs if is_from_valid_set(x)]
    train_y = [x for x in labels if not is_from_valid_set(x)]
    valid_y = [x for x in labels if is_from_valid_set(x)]

    for f in train_x:
        shutil.copyfile(os.path.join("data", f), os.path.join(x_train_dir, f))

    for f in train_y:
        shutil.copyfile(os.path.join("data", f), os.path.join(y_train_dir, f))

    for f in valid_x:
        shutil.copyfile(os.path.join("data", f), os.path.join(x_valid_dir, f))

    for f in valid_y:
        shutil.copyfile(os.path.join("data", f), os.path.join(y_valid_dir, f))

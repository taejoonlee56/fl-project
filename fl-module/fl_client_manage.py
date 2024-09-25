
import threading
from abc import ABC, abstractmethod
from logging import INFO
from typing import Dict, List, Optional, Tuple

from flwr.common.logger import log
from flwr.server.client_proxy import ClientProxy
from flwr.server.criterion import Criterion

import numpy as np
import pandas as pd
import random
import csv
from collections import defaultdict
import time
import os

from fl_cs_oort import Oort as Oort
from fl_cs_towards import Towards as Towards
from fl_cs_proposed import Proposed as Proposed
from fl_cs_random import FL_random as FL_random

FL_SERVER_IP ="0.0.0.0"
FL_SERVER_PORT = 9999
SOCKET_IP = "0.0.0.0"
SOCKET_PORT = 12001
GLOBAL_TIME = time.time()

def load_and_remove_battery_info(file_name):
    with open(file_name, mode='r') as file:
        rows = list(csv.reader(file))
    
    battery_info = rows[1]  # 첫 번째 행 데이터 가져오기
    
    with open(file_name, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(rows[1:])  # 첫 번째 행 제외하고 다시 쓰기

    return {
        "battery_level": int(battery_info[0]),
        "charge_speed": float(battery_info[1]),
        "battery_capacity": int(battery_info[2]),
    }


class ClientManager(ABC):
    """Abstract base class for managing Flower clients."""

    @abstractmethod
    def num_available(self) -> int:
        """Return the number of available clients."""

    @abstractmethod
    def register(self, client: ClientProxy) -> bool:
        """Register Flower ClientProxy instance.

        Returns:
            bool: Indicating if registration was successful
        """

    @abstractmethod
    def unregister(self, client: ClientProxy) -> None:
        """Unregister Flower ClientProxy instance."""

    @abstractmethod
    def all(self) -> Dict[str, ClientProxy]:
        """Return all available clients."""

    @abstractmethod
    def wait_for(self, num_clients: int, timeout: int) -> bool:
        """Wait until at least `num_clients` are available."""

    @abstractmethod
    def sample(
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        criterion: Optional[Criterion] = None,
    ) -> List[ClientProxy]:
        """Sample a number of Flower ClientProxy instances."""


class SimpleClientManager(ClientManager):
    """Provides a pool of available clients."""

    def __init__(self, min_fit_clients, F, W) -> None:
        self.clients: Dict[str, ClientProxy] = {}
        self.entire_clients = defaultdict()
        self._cv = threading.Condition()
        self.min_fit_clients = min_fit_clients
        self.F = F
        self.W = W
        
    def __len__(self) -> int:
        return len(self.clients)

    def wait_for(self, num_clients: int = 0, timeout: int = 30) -> bool:
        """Block until at least `num_clients` are available or until a timeout
        is reached.

        Current timeout default: 1 day. base : 86400
        
        """
        
        num_clients = self.min_fit_clients
        
        with self._cv:
            return self._cv.wait_for(
                lambda: len(self.clients) >= num_clients, timeout=timeout
            )

    def num_available(self,) -> int:
        """Return the number of available clients."""
        return len(self)

    def register(self, client: ClientProxy) -> bool:
        """Register Flower ClientProxy instance.

        Returns:
            bool: Indicating if registration was successful. False if ClientProxy is
                already registered or can not be registered for any reason
        
        """
        
        if client.cid in self.clients:
            return False

        self.clients[client.cid] = client
        with self._cv:
            self._cv.notify_all()
            
            
        max_c_rate = 0
        
        # 클라이언트 배터리 상태 임의로 할당
        for key, value in self.clients.items():
            if key not in self.entire_clients.keys():
                self.entire_clients[key]=load_and_remove_battery_info('battery_info.csv')
                self.entire_clients[key]['latest_update_time'] = int(time.time())
                self.entire_clients[key]['power_consumption'] = 0
                self.entire_clients[key]['selected'] = 0
                self.entire_clients[key]['accuracy'] = 0
                self.entire_clients[key]['loss'] = 0
                self.entire_clients[key]['train_time'] = 0
                self.entire_clients[key]['data_number'] = 0
                self.entire_clients[key]['cpu']= 0
                self.entire_clients[key]['ram']= 0
                self.entire_clients[key]['power_consumption']= 0
                self.entire_clients[key]['util_value']= 0
                self.entire_clients[key]['power_value']= 0
                self.entire_clients[key]['rewards']= 0
                self.entire_clients[key]['learning_step']= 'initial'
                
                max_c_rate = max(self.entire_clients[key]['charge_speed'] / self.entire_clients[key]['battery_capacity'], max_c_rate)
        
        self.max_c_rate = max_c_rate
        
        return True

    def unregister(self, client: ClientProxy) -> None:
        """Unregister Flower ClientProxy instance.

        This method is idempotent.
        """
        if client.cid in self.clients:
            del self.clients[client.cid]

            with self._cv:
                self._cv.notify_all()

    def all(self) -> Dict[str, ClientProxy]:
        """Return all available clients."""
        return self.clients

    def sample(
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        criterion: Optional[Criterion] = None,
    ) -> List[ClientProxy]:
        """Sample a number of Flower ClientProxy instances."""
        # Block until at least num_clients are connected.
        if min_num_clients is None:
            min_num_clients = num_clients
        self.wait_for(min_num_clients)
        # Sample clients which meet the criterion
        available_cids = list(self.clients)
        if criterion is not None:
            available_cids = [
                cid for cid in available_cids if criterion.select(self.clients[cid])
            ]

        if num_clients > len(available_cids):
            log(
                INFO,
                "Sampling failed: number of available clients"
                " (%s) is less than number of requested clients (%s).",
                len(available_cids),
                num_clients,
            )
            return []
        sampled_cids = random.sample(available_cids, min_num_clients)
        return [self.clients[cid] for cid in sampled_cids]

    def client_selection(self, num_clients, min_num_clients=None, \
        client_info=None, criterion=None,\
        server_round=0, \
        learning_step=None, start_time=None, method=None, \
        filename:str = None) -> List[ClientProxy]:
        
        trained_clients = dict()
        eval_clients = dict()
        
        updated_cids = []
        max_c_rate = 0
        
        # 전체 클라이언트 정보 : self.entire_clients 
        
        # 학습된 클라이언트 정보 : self.trained_clients
        if client_info:
                client_info_dict = {client[0].cid: client[1].metrics for client in client_info}
                
        for cid in self.entire_clients.keys():
            if client_info and cid in client_info_dict:
                if client_info_dict[cid]['learning_step'] == 'train':
                    trained_clients[cid] = client_info_dict[cid]
                    updated_cids.append(cid)
                    trained_clients[cid]['power_consumption'] = random.uniform(0.2, 0.3)
                    trained_clients[cid]['battery_level'] = self.entire_clients[cid]['battery_level']
                    trained_clients[cid]['battery_capacity'] = self.entire_clients[cid]['battery_capacity']
                    trained_clients[cid]['charge_speed'] = self.entire_clients[cid]['charge_speed']
                    trained_clients[cid]['latest_update_time'] = self.entire_clients[cid]['latest_update_time']
                    trained_clients[cid]['accuracy'] = client_info_dict[cid]['accuracy']
                    trained_clients[cid]['loss'] = client_info_dict[cid]['loss']
                    trained_clients[cid]['train_time'] = client_info_dict[cid]['train_time']
                    trained_clients[cid]['data_number'] = client_info_dict[cid]['data_number']
                    trained_clients[cid]['cpu']= client_info_dict[cid]['cpu']
                    trained_clients[cid]['ram']= client_info_dict[cid]['ram']
                    trained_clients[cid]['learning_step']= 'train'
                    self.entire_clients[cid] = trained_clients[cid]
                elif client_info_dict[cid]['learning_step'] == 'eval':
                    eval_clients[cid] = client_info_dict[cid]
                    updated_cids.append(cid)
                    eval_clients[cid]['power_consumption'] = 0
                    eval_clients[cid]['battery_level'] = self.entire_clients[cid]['battery_level']
                    eval_clients[cid]['battery_capacity'] = self.entire_clients[cid]['battery_capacity']
                    eval_clients[cid]['charge_speed'] = self.entire_clients[cid]['charge_speed']
                    eval_clients[cid]['latest_update_time'] = self.entire_clients[cid]['latest_update_time']
                    eval_clients[cid]['accuracy'] = client_info_dict[cid]['accuracy']
                    eval_clients[cid]['loss'] = client_info_dict[cid]['loss']
                    eval_clients[cid]['train_time'] = client_info_dict[cid]['train_time']
                    eval_clients[cid]['data_number'] = client_info_dict[cid]['data_number']
                    eval_clients[cid]['cpu']= client_info_dict[cid]['cpu']
                    eval_clients[cid]['ram']= client_info_dict[cid]['ram']
                    eval_clients[cid]['learning_step']= 'eval'
                    self.entire_clients[cid] = eval_clients[cid]
            
        # 실험 해야할거
        # f = [0, 0.5, 1.00]
        # w = [0, 0.5, 1.00]
        # f = 0 w = 0, 랜덤, 제안, EAFL, oort 
        # f = 0 w = 0.5 랜덤, 제안, EAFL, oort 
        # f = 0 w = 1 랜덤, 제안, EAFL, oort 
        # f = 0.5 w = 0 랜덤, 제안, EAFL, oort 
        # f = 0.5 w = 0.5 랜덤, 제안, EAFL, oort 
        # f = 0.5 w = 1 랜덤, 제안, EAFL, oort 
        # f = 1 w = 0 랜덤, 제안, EAFL, oort 
        # f = 1 w = 0.5 랜덤, 제안, EAFL, oort 
        # f = 1 w = 1 랜덤, 제안, EAFL, oort  
        F = self.F
        W = self.W
        T = 6000
        print("-"*20)
        print(F, W, T)
        print("-"*20)

        if method == "random":
            fl_random = FL_random(self.entire_clients, server_round, learning_step, start_time)
            candidate_dict = fl_random.select(server_round, updated_cids, self.max_c_rate, F=F, W=W, T=T)
            for key in candidate_dict:
                candidate_dict[key] = random.randint(1, 100)
            csv_data = fl_random.get_csv_data()
            self.entire_clients = fl_random.get_entire_clients()
        elif method == "proposed":
            proposed = Proposed(self.entire_clients, server_round, learning_step, start_time)
            candidate_dict = proposed.select(server_round, updated_cids, self.max_c_rate, F=F, W=W, T=T)
            csv_data = proposed.get_csv_data()
            self.entire_clients = proposed.get_entire_clients()
        elif method == "towards":
            towards = Towards(self.entire_clients, server_round, learning_step, start_time)
            candidate_dict = towards.select(server_round, updated_cids, self.max_c_rate, F=F, W=W, T=T)
            csv_data = towards.get_csv_data()
            self.entire_clients = towards.get_entire_clients()
        elif method == "oort":
            oort = Oort(self.entire_clients, server_round, learning_step, start_time)
            candidate_dict = oort.select(server_round, updated_cids, self.max_c_rate, F=F, W=W, T=T)
            csv_data = oort.get_csv_data()
            self.entire_clients = oort.get_entire_clients()
        else:
            raise Exception("Invalid method")
        
        sorted_candidate_dict = sorted(candidate_dict.items(), key= lambda item:item[1], reverse=True)
        cids = [item[0] for item in sorted_candidate_dict]
        targets_cids = cids[0:min_num_clients]
        
        # csv_data None이 아닐 때
        if csv_data:  
            self._to_csv(filename, csv_data, targets_cids, server_round, learning_step, method)    
            
        if learning_step == 'training':
            # return [self.clients[cid] for cid in targets_cids]
            return [self.clients[cid] for cid in self.entire_clients.keys()]
        else:
            return [self.clients[cid] for cid in targets_cids]
            # return [self.clients[cid] for cid in self.entire_clients.keys()]
        
    def _to_csv(self, filename, csv_data, targets_cids, server_round, learning_step:str, method:str):
        # 여기서 csv data dictionary로 저장
        df = pd.DataFrame(csv_data)
        df.columns = ['learning_step', 'id', 'method', \
        'server_round', 'selected', 'accuracy', 'loss', 'train_time', 'battery_level', \
        'charge_speed', 'util_value', 'power_value', 'rewards', 'power_consumption', 'cpu', 'ram', 'elapsed_time']
        
        if not os.path.isfile(filename):
            df.to_csv(filename, mode='w')  # Write header for the first time
        else:
            df.to_csv(filename, mode='a', header=False)
        
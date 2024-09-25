
import random
import threading
from abc import ABC, abstractmethod
from logging import INFO
from typing import Dict, List, Optional, Tuple

from flwr.common.logger import log
from flwr.server.client_proxy import ClientProxy
from flwr.server.criterion import Criterion

from flwr.common import EvaluateRes

import numpy as np
import math
import pandas as pd
import os
import requests
import json
import csv
from collections import defaultdict
import time

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
    }


def update_battery_status(battery_level: int, power_consumption:int, charge_speed:float, train_time: float, max_battery_level:int ,start_time) -> dict:
    # 전력 소모에 따라 배터리 상태 변수 업데이트
    # time: 소비 시간 (단위: 초)
    # 배터리 잔량 업데이트
    # 300w = 300 j / s
    # time은 초, 시간으로 변환 필요
    # time / 3600
    # time 원래 시간 단위로 
    
    if train_time == 0:
        train_time = 0.00001
            
    # 이게 실제 단위(초)
    consumed_energy = power_consumption * train_time / 3600
    charged_energy = charge_speed * start_time / 3600
    # 120k = 10분 충전, 20k
    
    
    # 이건 초를 분으로 바꿔버리기(분)
    # consumed_energy = power_consumption * train_time / 60
    # charged_energy = charge_speed * start_time / 60
    
    
    battery_level = battery_level - consumed_energy + charged_energy
    
    if battery_level > max_battery_level:
        battery_level = max_battery_level

    return battery_level

def util(data_size, loss, T, ti, a = 1):
    # loss
    # T : 상수 T, 사용자가 선호하는 시간
    # ti : i 클라이언트가 마지막으로 업데이트한 값
    # a : 상수 a, 사용자가 세팅한 상수
    time_ratio = (T / ti) if T < ti else 1 #  T < ti 참이면 1, 아니면 0, 시간느린애 걸러내기
    return data_size * math.sqrt(loss) * time_ratio ** a


def power(battery_level, charge_speed, max_battery_level = 100, W = 0.2):
    # 배터리 잔량도 고려해야되고, 충전 속도도 고려해야 함
    # 두개 값을 곱해서 충전 시간으로 표현하지 않는 이유 : 충전 속도(V, I)에 따라 잔량에 정보가 흩어짐
    # 내 방법
    if charge_speed == 0:
        return 0
    
    # score= W *  battery_level + (1 - W) * (max_battery_level - battery_level) / charge_speed
    
    # towards 방법
    # C = 1 
    score= battery_level
    
    return score

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

    def __init__(self) -> None:
        self.clients: Dict[str, ClientProxy] = {}
        self.custom_clients = defaultdict()
        self._cv = threading.Condition()
        
    def __len__(self) -> int:
        return len(self.clients)

    def wait_for(self, num_clients: int = 4, timeout: int = 30) -> bool:
        """Block until at least `num_clients` are available or until a timeout
        is reached.

        Current timeout default: 1 day. base : 86400
        
        """
        
        num_clients = 4
        
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
        
        # 클라이언트 배터리 상태 임의로 할당
        for key, value in self.clients.items():
            if key not in self.custom_clients.keys():
                self.custom_clients[key]=load_and_remove_battery_info('battery_info.csv')
                self.custom_clients[key]['latest_update_time'] = int(time.time())

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

    def battery_optimization(
        # 비교 방법#
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 0.1,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: Optional[float] = None,
    ) -> List[ClientProxy]:

        # 데이터 저장 코드
        data = []
        data_selected = []
        
        
        # Block until at least num_clients are connected.
        if min_num_clients is None:
            min_num_clients = num_clients
            
        self.wait_for(min_num_clients, 100)
                
        # Sample clients which meet the criterion
        available_cids = list(self.clients) 
        candidate_dict = dict()
        
        if server_round == 1:
            for cid in self.custom_clients.keys():
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                candidate_dict[cid] = power_value
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                
            
        else:
            if client_info:
                client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

            for cid in self.custom_clients.keys():
                if client_info and cid in client_info_dict:
                    custom_info = client_info_dict[cid]
                    power_consumption = random.uniform(0.2, 0.3)
                    self.custom_clients[cid]['power_consumption'] = power_consumption

                    util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                    power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                    rewards = F * util_value + (1.0 - F) * power_value
                    candidate_dict[cid] = rewards
                    
                    elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                    
                    self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)
                    data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, custom_info['accuracy'], custom_info['loss'], custom_info['train_time'], self.custom_clients[cid]['battery_level'],\
                        self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                    
                    self.custom_clients[cid]['latest_update_time'] =  int(time.time())
                else:
                    power_consumption = 0
                    self.custom_clients[cid]['power_consumption'] = power_consumption
                    power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                    candidate_dict[cid] = power_value
                    
                    elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                    
                    self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                    data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                        self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                    
                
        sorted_candidate_dict = sorted(candidate_dict.items(), key= lambda item:item[1], reverse=True)
        cids = [item[0] for item in sorted_candidate_dict]
    
        
        targets_cids = cids[0:min_num_clients]
        
        convert_targets_cids = []
        convert_targets_cids.append(server_round)
        for cid in targets_cids:
            convert_targets_cids.append(str(self.custom_clients[cid]['charge_speed'])+'kW')
        
        data_selected.append(convert_targets_cids)
        results = [self.clients[cid] for cid in targets_cids]
        
        
        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('battery_data.csv'):
            data_df.to_csv('battery_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('battery_data.csv', mode='a', header=False)

        if not os.path.isfile('battery_data_selected.csv'):
            data_selected_df.to_csv('battery_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('battery_data_selected.csv', mode='a', header=False)
        
        return results

    def battery_optimization_eval(
        # 비교 방법#
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 0.1,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: Optional[float] = None,
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
        
        # 데이터 저장 코드
        data = []
        data_selected = []
        candidate_dict = dict()
        
        if client_info:
            client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

        for cid in self.custom_clients.keys():
            if client_info and cid in client_info_dict:
                custom_info = client_info_dict[cid]
                power_consumption = random.uniform(0.2, 0.3)
                self.custom_clients[cid]['power_consumption'] = power_consumption

                util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                rewards = F * util_value + (1.0 - F) * power_value
                candidate_dict[cid] = rewards
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)
                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, custom_info['accuracy'], custom_info['loss'], custom_info['train_time'], self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                
                self.custom_clients[cid]['latest_update_time'] =  int(time.time())
            else:
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                candidate_dict[cid] = power_value
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
        
        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('battery_data.csv'):
            data_df.to_csv('battery_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('battery_data.csv', mode='a', header=False)

        if not os.path.isfile('battery_data_selected.csv'):
            data_selected_df.to_csv('battery_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('battery_data_selected.csv', mode='a', header=False)
        
        sampled_cids = self.custom_clients.keys()
        return [self.clients[cid] for cid in sampled_cids]

    def towards(
        # 비교 방법#
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 0.1,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: Optional[float] = None,
    ) -> List[ClientProxy]:

        # 데이터 저장 코드
        data = []
        data_selected = []
        
        
        # Block until at least num_clients are connected.
        if min_num_clients is None:
            min_num_clients = num_clients
            
        self.wait_for(min_num_clients, 100)
                
        # Sample clients which meet the criterion
        available_cids = list(self.clients) 
        candidate_dict = dict()
        
        if server_round == 1:
            for cid in self.custom_clients.keys():
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                candidate_dict[cid] = power_value
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                
            
        else:
            if client_info:
                client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

            for cid in self.custom_clients.keys():
                if client_info and cid in client_info_dict:
                    custom_info = client_info_dict[cid]
                    power_consumption = random.uniform(0.2, 0.3)
                    self.custom_clients[cid]['power_consumption'] = power_consumption

                    util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                    power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                    rewards = F * util_value + (1.0 - F) * power_value
                    candidate_dict[cid] = rewards
                    
                    elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                    
                    self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)
                    data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, custom_info['accuracy'], custom_info['loss'], custom_info['train_time'], self.custom_clients[cid]['battery_level'],\
                        self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                    
                    self.custom_clients[cid]['latest_update_time'] =  int(time.time())
                else:
                    power_consumption = 0
                    self.custom_clients[cid]['power_consumption'] = power_consumption
                    power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                    candidate_dict[cid] = power_value
                    
                    elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                    
                    self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                    data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                        self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                    
                
        sorted_candidate_dict = sorted(candidate_dict.items(), key= lambda item:item[1], reverse=True)
        cids = [item[0] for item in sorted_candidate_dict]
    
        
        targets_cids = cids[0:min_num_clients]
        
        convert_targets_cids = []
        convert_targets_cids.append(server_round)
        for cid in targets_cids:
            convert_targets_cids.append(str(self.custom_clients[cid]['charge_speed'])+'kW')
        
        data_selected.append(convert_targets_cids)
        results = [self.clients[cid] for cid in targets_cids]
        
        
        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('towards_data.csv'):
            data_df.to_csv('towards_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('towards_data.csv', mode='a', header=False)

        if not os.path.isfile('towards_data_selected.csv'):
            data_selected_df.to_csv('towards_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('towards_data_selected.csv', mode='a', header=False)
        
        return results

    def towards_eval(
        # 비교 방법#
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 0.1,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: Optional[float] = None,
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
        
        # 데이터 저장 코드
        data = []
        data_selected = []
        candidate_dict = dict()
        
        if client_info:
            client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

        for cid in self.custom_clients.keys():
            if client_info and cid in client_info_dict:
                custom_info = client_info_dict[cid]
                power_consumption = random.uniform(0.2, 0.3)
                self.custom_clients[cid]['power_consumption'] = power_consumption

                util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                rewards = F * util_value + (1.0 - F) * power_value
                candidate_dict[cid] = rewards
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)
                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, custom_info['accuracy'], custom_info['loss'], custom_info['train_time'], self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                
                self.custom_clients[cid]['latest_update_time'] =  int(time.time())
            else:
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                candidate_dict[cid] = power_value
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Proposed', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
        
        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('towards_data.csv'):
            data_df.to_csv('towards_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('towards_data.csv', mode='a', header=False)

        if not os.path.isfile('towards_data_selected.csv'):
            data_selected_df.to_csv('towards_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('towards_data_selected.csv', mode='a', header=False)
        
        sampled_cids = self.custom_clients.keys()
        return [self.clients[cid] for cid in sampled_cids]


    def oort(
        # 비교 방법#
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 1,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: Optional[float] = None,
    ) -> List[ClientProxy]:

        # 데이터 저장 코드
        data = []
        data_selected = []
        
        
        # Block until at least num_clients are connected.
        if min_num_clients is None:
            min_num_clients = num_clients
            
        self.wait_for(min_num_clients, 100)
                
        # Sample clients which meet the criterion
        available_cids = list(self.clients) 
        candidate_dict = dict()
        
        if server_round == 1:
            for cid in self.custom_clients.keys():
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                candidate_dict[cid] = power_value
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                
            
        else:
            if client_info:
                client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

            for cid in self.custom_clients.keys():
                if client_info and cid in client_info_dict:
                    custom_info = client_info_dict[cid]
                    power_consumption = random.uniform(0.2, 0.3)
                    self.custom_clients[cid]['power_consumption'] = power_consumption

                    util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                    power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                    rewards = F * util_value + (1.0 - F) * power_value
                    candidate_dict[cid] = rewards
                    
                    elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                    
                    self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)
                    data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, custom_info['accuracy'], custom_info['loss'], custom_info['train_time'], self.custom_clients[cid]['battery_level'],\
                        self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                    
                    self.custom_clients[cid]['latest_update_time'] =  int(time.time())
                else:
                    power_consumption = 0
                    self.custom_clients[cid]['power_consumption'] = power_consumption
                    power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                    candidate_dict[cid] = power_value
                    
                    elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                    
                    self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                    data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                        self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                    
                
        sorted_candidate_dict = sorted(candidate_dict.items(), key= lambda item:item[1], reverse=True)
        cids = [item[0] for item in sorted_candidate_dict]
    
        
        targets_cids = cids[0:min_num_clients]
        
        convert_targets_cids = []
        convert_targets_cids.append(server_round)
        for cid in targets_cids:
            convert_targets_cids.append(str(self.custom_clients[cid]['charge_speed'])+'kW')
        
        data_selected.append(convert_targets_cids)
        results = [self.clients[cid] for cid in targets_cids]
        
        
        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('oort_data.csv'):
            data_df.to_csv('oort_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('oort_data.csv', mode='a', header=False)

        if not os.path.isfile('oort_data_selected.csv'):
            data_selected_df.to_csv('oort_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('oort_data_selected.csv', mode='a', header=False)
        
        return results

    def oort_eval(
        # 비교 방법#
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 1,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: Optional[float] = None,
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
        
        # 데이터 저장 코드
        data = []
        data_selected = []
        candidate_dict = dict()
        
        if client_info:
            client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

        for cid in self.custom_clients.keys():
            if client_info and cid in client_info_dict:
                custom_info = client_info_dict[cid]
                power_consumption = random.uniform(0.2, 0.3)
                self.custom_clients[cid]['power_consumption'] = power_consumption

                util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                rewards = F * util_value + (1.0 - F) * power_value
                candidate_dict[cid] = rewards
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)
                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, custom_info['accuracy'], custom_info['loss'], custom_info['train_time'], self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                
                self.custom_clients[cid]['latest_update_time'] =  int(time.time())
            else:
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                candidate_dict[cid] = power_value
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
        
        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('oort_data.csv'):
            data_df.to_csv('oort_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('oort_data.csv', mode='a', header=False)
        if not os.path.isfile('oort_data_selected.csv'):
            data_selected_df.to_csv('oort_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('oort_data_selected.csv', mode='a', header=False)
        
        sampled_cids = self.custom_clients.keys()
        return [self.clients[cid] for cid in sampled_cids]



    def random(
        # 비교 방법#
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 1,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: Optional[float] = None,
    ) -> List[ClientProxy]:

        # 데이터 저장 코드
        data = []
        data_selected = []
        
        
        # Block until at least num_clients are connected.
        if min_num_clients is None:
            min_num_clients = num_clients
            
        self.wait_for(min_num_clients, 100)
                
        # Sample clients which meet the criterion
        available_cids = list(self.clients) 
        candidate_dict = dict()
        
        if server_round == 1:
            for cid in self.custom_clients.keys():
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                candidate_dict[cid] = power_value
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                
            
        else:
            if client_info:
                client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

            for cid in self.custom_clients.keys():
                if client_info and cid in client_info_dict:
                    custom_info = client_info_dict[cid]
                    power_consumption = random.uniform(0.2, 0.3)
                    self.custom_clients[cid]['power_consumption'] = power_consumption

                    util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                    power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                    rewards = F * util_value + (1.0 - F) * power_value
                    candidate_dict[cid] = rewards
                    
                    elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                    
                    self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)
                    data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, custom_info['accuracy'], custom_info['loss'], custom_info['train_time'], self.custom_clients[cid]['battery_level'],\
                        self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                    
                    self.custom_clients[cid]['latest_update_time'] =  int(time.time())
                else:
                    power_consumption = 0
                    self.custom_clients[cid]['power_consumption'] = power_consumption
                    power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                    candidate_dict[cid] = power_value
                    
                    elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                    
                    self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                    data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                        self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                    
                
        sorted_candidate_dict = sorted(candidate_dict.items(), key= lambda item:item[1], reverse=True)
        cids = [item[0] for item in sorted_candidate_dict]
    
        
        targets_cids = random.sample(available_cids, min_num_clients)
        
        convert_targets_cids = []
        convert_targets_cids.append(server_round)
        for cid in targets_cids:
            convert_targets_cids.append(str(self.custom_clients[cid]['charge_speed'])+'kW')
        
        data_selected.append(convert_targets_cids)
        
        results = [self.clients[cid] for cid in targets_cids]
        
        
        
        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('random_data.csv'):
            data_df.to_csv('random_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('random_data.csv', mode='a', header=False)
        if not os.path.isfile('random_data_selected.csv'):
            data_selected_df.to_csv('random_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('random_data_selected.csv', mode='a', header=False)
        
        return results

    def random_eval(
        # 비교 방법#
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 1,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: Optional[float] = None,
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
        
        # 데이터 저장 코드
        data = []
        data_selected = []
        candidate_dict = dict()
        
        if client_info:
            client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

        for cid in self.custom_clients.keys():
            if client_info and cid in client_info_dict:
                custom_info = client_info_dict[cid]
                power_consumption = random.uniform(0.2, 0.3)
                self.custom_clients[cid]['power_consumption'] = power_consumption

                util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                rewards = F * util_value + (1.0 - F) * power_value
                candidate_dict[cid] = rewards
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)
                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, custom_info['accuracy'], custom_info['loss'], custom_info['train_time'], self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
                
                self.custom_clients[cid]['latest_update_time'] =  int(time.time())
            else:
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],self.custom_clients[cid]['charge_speed'],battery_capacity)
                candidate_dict[cid] = power_value
                
                elasp_time = int(time.time() - self.custom_clients[cid]['latest_update_time'])
                
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, elasp_time)

                data.append([learning_step, str(self.custom_clients[cid]['charge_speed'])+'kW', 'Oort', server_round, 0, 0, 0, 0, self.custom_clients[cid]['battery_level'],\
                    self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
        
        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('random_data.csv'):
            data_df.to_csv('random_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('random_data.csv', mode='a', header=False)
        if not os.path.isfile('random_data_selected.csv'):
            data_selected_df.to_csv('random_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('random_data_selected.csv', mode='a', header=False)
        
        sampled_cids = self.custom_clients.keys()
        return [self.clients[cid] for cid in sampled_cids]




    def sample(
        self,
        num_clients: int,
        min_num_clients: Optional[int] = None,
        client_info:List[Tuple[ClientProxy, EvaluateRes]] = None,
        # criterion: Optional[Criterion] = customized_criterion(),
        criterion: Optional[Criterion] = None,
        F = 0.5,
        server_round: int = 0,
        battery_capacity:int = 100,
        learning_step: Optional[str] = None,
        start_time: float = 0,
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
        
        # 데이터 저장 코드
        data = []
        data_selected = []
        candidate_dict = dict()
        
        # Convert client_info to a dictionary for faster lookup
        if client_info:
            client_info_dict = {client[0].cid: client[1].metrics for client in client_info}

        for cid in self.custom_clients.keys():
            if client_info and cid in client_info_dict:
                custom_info = client_info_dict[cid]
                power_consumption = random.uniform(0.2, 0.3)
                self.custom_clients[cid]['power_consumption'] = power_consumption

                util_value = util(custom_info['data_number'], custom_info['loss'], T=300, ti = custom_info['train_time'])
                power_value = power(self.custom_clients[cid]['battery_level'],0,battery_capacity)
                rewards = F * util_value + (1.0 - F) * power_value
                candidate_dict[cid] = rewards
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, start_time)
                data.append([learning_step, cid, server_round, custom_info['accuracy'], custom_info['loss'], self.custom_clients[cid]['battery_level'], self.custom_clients[cid]['charge_speed'], util_value, power_value, rewards, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])
            else:
                power_consumption = 0
                self.custom_clients[cid]['power_consumption'] = power_consumption
                power_value = power(self.custom_clients[cid]['battery_level'],0,battery_capacity)
                candidate_dict[cid] = power_value
                self.custom_clients[cid]['battery_level'] = update_battery_status(self.custom_clients[cid]['battery_level'], power_consumption, self.custom_clients[cid]['charge_speed'], custom_info.get('train_time', 0) if client_info and cid in client_info_dict else 0, battery_capacity, start_time)

                data.append([learning_step, cid, server_round, 0, 0, self.custom_clients[cid]['battery_level'], self.custom_clients[cid]['charge_speed'], 0, power_value, power_value, self.custom_clients[cid]['power_consumption'], int(time.time()-start_time)])

        data_df = pd.DataFrame(data)
        data_selected_df = pd.DataFrame(data_selected)

        if not os.path.isfile('random_data.csv'):
            data_df.to_csv('random_data.csv', mode='w')  # Write header for the first time
        else:
            data_df.to_csv('random_data.csv', mode='a', header=False)

        if not os.path.isfile('random_data_selected.csv'):
            data_selected_df.to_csv('random_data_selected.csv', mode='w')  # Write header for the first time
        else:
            data_selected_df.to_csv('random_data_selected.csv', mode='a', header=False)
        
        sampled_cids = random.sample(available_cids, min_num_clients)
        return [self.clients[cid] for cid in sampled_cids]
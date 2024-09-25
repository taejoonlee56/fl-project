import random
import math
import numpy as np
import pandas as pd
import time
import os 

def update_battery_status(battery_level: int, power_consumption:int, charge_speed:float, train_time: float, max_battery_level:int ,start_time) -> dict:
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


def power(battery_level, charge_speed, max_battery_level, max_c_rate, W):
    
    # score= W *  battery_level + (1 - W) * (max_battery_level - battery_level) / charge_speed
    if max_c_rate == 0:
        return 0
    
    c_rate = charge_speed / max_battery_level
    
    normalized_c_rate = c_rate / max_c_rate
    
    score= W *  battery_level + (1 - W) * normalized_c_rate
    
    return score

        
        
class Oort():
    def __init__(self, entire_clients:dict = None, \
        server_round:int = 1, learning_step:str = None, start_time:int = 0) -> None:
        self.entire_clients = entire_clients
        self.server_round = server_round
        self.learning_step = learning_step
        self.start_time = start_time
        self.csv_data = []
        self.method_name = 'oort'
            
    def select(self, server_round:int = 0,updated_cids:list = [], max_c_rate:float = 0.0, F :float = 0.5, W:float = 0.5, T:int = 550, ):
        candidate_dict = {}
          
        for cid in self.entire_clients.keys():
            
            print(f"oort | F = {F} | W = {W}")
            
            # eval이 저장되어야 함.
            if self.learning_step =='evaluation':
                power_consumption = 0
                self.entire_clients[cid]['power_consumption'] = power_consumption
                util_value = util(self.entire_clients[cid]['data_number'], self.entire_clients[cid]['loss'], T=T, ti=self.entire_clients[cid]['train_time'])
                power_value = power(self.entire_clients[cid]['battery_level'], self.entire_clients[cid]['charge_speed'], self.entire_clients[cid]['battery_capacity'], max_c_rate, W=W)
                rewards = F * util_value + (1.0 - F) * power_value
                self.entire_clients[cid]['util_value'] = util_value
                self.entire_clients[cid]['power_value'] = power_value
                self.entire_clients[cid]['rewards'] = rewards
                                
                candidate_dict[cid] = rewards
                                
                self.entire_clients[cid]['train_time'] = 0      
                elapsed_time = int(time.time() - self.entire_clients[cid]['latest_update_time'])
                
                self.entire_clients[cid]['battery_level'] = update_battery_status(self.entire_clients[cid]['battery_level'], self.entire_clients[cid]['power_consumption'], self.entire_clients[cid]['charge_speed'], self.entire_clients[cid]['train_time'], self.entire_clients[cid]['battery_capacity'], elapsed_time)
                self.save_data(0, self.entire_clients[cid])
                
                # self.entire_clients[cid]['latest_update_time'] = int(time.time())
                self.entire_clients[cid] = self.entire_clients[cid]
                
            elif cid in updated_cids and self.learning_step =='training':
                power_consumption = random.uniform(0.2, 0.3)
                self.entire_clients[cid]['power_consumption'] = power_consumption
                util_value = util(self.entire_clients[cid]['data_number'], self.entire_clients[cid]['loss'], T=T, ti=self.entire_clients[cid]['train_time'])
                power_value = power(self.entire_clients[cid]['battery_level'], self.entire_clients[cid]['charge_speed'], self.entire_clients[cid]['battery_capacity'], max_c_rate, W=W)
                rewards = F * util_value + (1.0 - F) * power_value
                self.entire_clients[cid]['util_value'] = util_value
                self.entire_clients[cid]['power_value'] = power_value
                self.entire_clients[cid]['rewards'] = rewards
                                
                candidate_dict[cid] = rewards
                                
                elapsed_time = int(time.time() - self.entire_clients[cid]['latest_update_time'])
                self.entire_clients[cid]['train_time'] = elapsed_time   
                
                self.entire_clients[cid]['battery_level'] = update_battery_status(self.entire_clients[cid]['battery_level'], self.entire_clients[cid]['power_consumption'], self.entire_clients[cid]['charge_speed'], self.entire_clients[cid]['train_time'], self.entire_clients[cid]['battery_capacity'], elapsed_time)
                self.save_data(1, self.entire_clients[cid])
                
                self.entire_clients[cid]['latest_update_time'] = int(time.time())
                self.entire_clients[cid] = self.entire_clients[cid]
            
            elif server_round == 1 and self.learning_step =='training':
                util_value = util(self.entire_clients[cid]['data_number'], self.entire_clients[cid]['loss'], T=T, ti=self.entire_clients[cid]['train_time'])
                power_value = power(self.entire_clients[cid]['battery_level'], self.entire_clients[cid]['charge_speed'], self.entire_clients[cid]['battery_capacity'], max_c_rate, W=W)
                rewards = F * util_value + (1.0 - F) * power_value
                self.entire_clients[cid]['util_value'] = util_value
                self.entire_clients[cid]['power_value'] = power_value
                self.entire_clients[cid]['rewards'] = rewards
                                
                candidate_dict[cid] = rewards
                                
                elapsed_time = int(time.time() - self.entire_clients[cid]['latest_update_time'])
                self.entire_clients[cid]['train_time'] = elapsed_time   
                
                self.entire_clients[cid]['battery_level'] = update_battery_status(self.entire_clients[cid]['battery_level'], self.entire_clients[cid]['power_consumption'], self.entire_clients[cid]['charge_speed'], self.entire_clients[cid]['train_time'], self.entire_clients[cid]['battery_capacity'], elapsed_time)
                self.save_data(1, self.entire_clients[cid])
                
                self.entire_clients[cid]['latest_update_time'] = int(time.time())
                self.entire_clients[cid] = self.entire_clients[cid]
            
            else:
                power_consumption = 0
                self.entire_clients[cid]['accuracy'] = 0
                self.entire_clients[cid]['loss'] = 0
                self.entire_clients[cid]['power_consumption'] = power_consumption
                util_value = 0
                power_value = power(self.entire_clients[cid]['battery_level'], self.entire_clients[cid]['charge_speed'], self.entire_clients[cid]['battery_capacity'], max_c_rate ,W=W)
                rewards = F * util_value + (1.0 - F) * power_value
                self.entire_clients[cid]['util_value'] = util_value
                self.entire_clients[cid]['power_value'] = power_value
                self.entire_clients[cid]['rewards'] = rewards
                
                candidate_dict[cid] = power_value
                
                elapsed_time = int(time.time() - self.entire_clients[cid]['latest_update_time'])
                
                self.entire_clients[cid]['battery_level'] = update_battery_status(self.entire_clients[cid]['battery_level'], power_consumption, self.entire_clients[cid]['charge_speed'], self.entire_clients[cid]['train_time'], self.entire_clients[cid]['battery_capacity'], elapsed_time)
                
                self.save_data(0, self.entire_clients[cid])
                self.entire_clients[cid]['latest_update_time'] = int(time.time())

        return candidate_dict
                
    def save_data(self, selected:int, clients:dict):
                
        self.csv_data.append([self.learning_step, f"{clients['charge_speed']}kW", self.method_name, self.server_round, selected, clients['accuracy'], \
        clients['loss'], clients['train_time'], clients['battery_level'], clients['charge_speed'], \
        clients['util_value'], clients['power_value'], clients['rewards'], clients['power_consumption'], clients['cpu'], clients['ram'], int(time.time()-self.start_time)])
        

    def get_csv_data(self):
        return self.csv_data
    
    def get_entire_clients(self):
        return self.entire_clients
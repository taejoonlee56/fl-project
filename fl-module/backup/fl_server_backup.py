from ast import Param
import flwr as fl
from typing import List, Tuple, Union, Dict, Optional
import torch
from collections import OrderedDict
import numpy as np
from fastseg import MobileV3Small
from flwr.common import Parameters,FitRes, EvaluateRes, Scalar
from flwr.server.client_proxy import ClientProxy
import argparse
import socketio
import json
import fl_client_manage as cm


class AggregateCustomMetricStrategy(fl.server.strategy.FedAvg):
    def aggregate_evaluate(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, EvaluateRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[float], Dict[str, Scalar]]:
        """Aggregate evaluation accuracy using weighted average."""

        if not results:
            return None, {}

        # Call aggregate_evaluate from base class (FedAvg) to aggregate loss and metrics
        aggregated_loss, aggregated_metrics = super().aggregate_evaluate(server_round, results, failures)

        # Weigh accuracy of each client by number of examples used
        accuracies = [r.metrics["accuracy"] * r.num_examples for _, r in results]
        examples = [r.num_examples for _, r in results]

        # Aggregate and print custom metric
        aggregated_accuracy = sum(accuracies) / sum(examples)
        
        
        # sio = socketio.Client()
        # sio.connect('http://localhost:8080')
        
        data = {'Accuracy': aggregated_accuracy}
        # json_data  = json.dumps(data)
                
        # sio.emit(f'get_server_acc',  json_data)
        # print("Analysis Results")
        # print("*" * 20)
        # for item in results:
        #     print("ID : ", item[0])
        #     print("Respone : ", item[1])
        #     print(type(item[1]))
        #     print(item[1].metrics)
    
        # print("*" * 20)
        print(f"Round {server_round} accuracy aggregated from client results: {aggregated_accuracy}")

        # Return aggregated loss and metrics (i.e., aggregated accuracy)
        return aggregated_loss, {"accuracy": aggregated_accuracy}

    
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-e", "--epoch", dest="epoch", action="store", required=True)          # extra value
    parser.add_argument("-n", "--number", dest="number", action="store", required=True)          # extra value
    parser.add_argument("-m", "--min_clients", dest="min_number", action="store", required=True)          # extra value
    args = parser.parse_args()
    
    strategy = AggregateCustomMetricStrategy(
        # (same arguments as FedAvg here)
        fraction_fit=0.1,  # Sample 10% of available clients for the next round
        min_fit_clients=int(args.min_number),  # Minimum number of clients to be sampled for the next round
        # min_fit_clients=int(args.number),  # Minimum number of clients to be sampled for the next round
        min_available_clients=int(args.number),  # Minimum number of clients that need to be connected to the server before a training round can start
    )
    print(args.min_number, args.number)
    
    # fl.server.start_server(server_address="flwr_server:9000", config = fl.server.ServerConfig(num_rounds=int(args.epoch)), strategy=strategy, client_manager=cm.SimpleClientManager())
    fl.server.start_server(server_address="0.0.0.0:9999", config = fl.server.ServerConfig(num_rounds=int(args.epoch)), strategy=strategy, client_manager=cm.SimpleClientManager())
    
import flwr as fl

from logging import WARNING

from flwr.common.logger import log
from typing import Callable, List, Tuple, Union, Dict, Optional
# from flwr.common import Parameters,FitRes, EvaluateRes, Scalar
from flwr.server.client_proxy import ClientProxy
import argparse
import fl_client_manage as cm
from flwr.common import (
    EvaluateIns,
    EvaluateRes,
    FitIns,
    FitRes,
    MetricsAggregationFn,
    NDArrays,
    Parameters,
    Scalar,
    ndarrays_to_parameters,
    parameters_to_ndarrays,
)

from flwr.server.strategy.aggregate import aggregate, weighted_loss_avg

from fastapi_server import FastAPIServer
from multiprocessing import Process
import requests
import json
import time
FL_SERVER_IP ="0.0.0.0"
FL_SERVER_PORT = 9999
SOCKET_IP = "0.0.0.0"
SOCKET_PORT = 12001

    
class AggregateCustomMetricStrategy(fl.server.strategy.FedAvg):

    def __init__(self, fraction_fit,min_fit_clients,min_available_clients,client_manager:cm, selection_method:str) -> None:
        # print("it's custimized criterion!")
        self.start_time = time.time()
        print(self.start_time)
        super().__init__()
        self.client_manager = client_manager
        self.clients_info = dict()
        self.min_available_clients = min_available_clients
        self.fraction_fit = fraction_fit
        self.min_fit_clients = min_fit_clients
        self.min_evaluate_clients = min_fit_clients
        self.selection_method = selection_method
        
    def configure_fit(
        self, server_round: int, parameters: Parameters, client_manager: cm
    ) -> List[Tuple[ClientProxy, FitIns]]:
        """Configure the next round of training."""
        config = {}
        if self.on_fit_config_fn is not None:
            # Custom fit config function provided
            config = self.on_fit_config_fn(server_round)
        fit_ins = FitIns(parameters, config)
        # client_manager = self.client_manager
        
        sample_size, min_num_clients = self.num_fit_clients(
            client_manager.num_available()
        )
        
        clients = client_manager.client_selection(
                num_clients=sample_size, 
                min_num_clients=self.min_fit_clients, 
                client_info=self.clients_info, 
                server_round = server_round,
                learning_step = 'training',
                start_time = self.start_time,
                method = self.selection_method,
                filename = str(self.selection_method)+'.csv'
            )
        # Return client/config pairs
        return [(client, fit_ins) for client in clients]

    def configure_evaluate(
        self, server_round: int, parameters: Parameters, client_manager: cm
    ) -> List[Tuple[ClientProxy, EvaluateIns]]:
        """Configure the next round of evaluation."""
        # Do not configure federated evaluation if fraction eval is 0.
        if self.fraction_evaluate == 0.0:
            return []
        
        # Parameters and config
        config = {}
        if self.on_evaluate_config_fn is not None:
            # Custom evaluation config function provided
            config = self.on_evaluate_config_fn(server_round)
        evaluate_ins = EvaluateIns(parameters, config)
            
        # client_manager = self.client_manager
        # Sample clients
        sample_size, min_num_clients = self.num_evaluation_clients(
            client_manager.num_available()
        )
        clients = client_manager.client_selection(
            num_clients=sample_size, 
            min_num_clients=self.min_fit_clients, 
            client_info=self.clients_info, 
            server_round = server_round,
            learning_step = 'evaluation',
            start_time = self.start_time,
            method = self.selection_method,
            filename = str(self.selection_method)+'.csv'
        )
            
        # Return client/config pairs
        return [(client, evaluate_ins) for client in clients]

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        """Aggregate fit results using weighted average."""
        if not results:
            return None, {}
        # Do not aggregate if there are failures and failures are not accepted
        if not self.accept_failures and failures:
            return None, {}

        # Convert results
        weights_results = [
            (parameters_to_ndarrays(fit_res.parameters), fit_res.num_examples)
            for _, fit_res in results
        ]
        parameters_aggregated = ndarrays_to_parameters(aggregate(weights_results))

        # Aggregate custom metrics if aggregation fn was provided
        metrics_aggregated = {}
        if self.fit_metrics_aggregation_fn:
            fit_metrics = [(res.num_examples, res.metrics) for _, res in results]
            metrics_aggregated = self.fit_metrics_aggregation_fn(fit_metrics)
        elif server_round == 1:  # Only log this warning once
            log(WARNING, "No fit_metrics_aggregation_fn provided")

        #여기추가함
        self.clients_info = results
        
        return parameters_aggregated, metrics_aggregated
    
    
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
        
        #여기추가함
        self.clients_info = results
        
        # Aggregate and print custom metric
        aggregated_accuracy = sum(accuracies) / sum(examples)
        print(f"Round {server_round} accuracy aggregated from client results: {aggregated_accuracy}")
        
        # Return aggregated loss and metrics (i.e., aggregated accuracy)
        return aggregated_loss, {"accuracy": aggregated_accuracy}

    
if __name__ == "__main__":
    

    parser = argparse.ArgumentParser()
    parser.add_argument("-e", "--epoch", dest="epoch", action="store", required=True)          # extra value
    parser.add_argument("-n", "--number", dest="number", action="store", required=True)          # extra value
    parser.add_argument("-m", "--min_clients", dest="min_number", action="store", required=True) 
    parser.add_argument("-s", "--selection_method", dest="selection_method", action="store", required=True)
    parser.add_argument("-f", "--f_value", dest="f", action="store", required=True)
    parser.add_argument("-w", "--w_value", dest="w", action="store", required=True)
    args = parser.parse_args()
        
    client_manager = cm.SimpleClientManager(
        min_fit_clients=int(args.min_number),
        F= float(args.f),
        W= float(args.w),
    )
    strategy = AggregateCustomMetricStrategy(
        fraction_fit=1.0,
        min_available_clients=int(args.number),
        min_fit_clients=int(args.min_number), 
        client_manager=client_manager,
        selection_method=args.selection_method,
    )

    # # Start FastAPI server in a separate process
    # fastapi_server = FastAPIServer(SOCKET_IP, SOCKET_PORT)
    # server_process = Process(target=fastapi_server.start)
    # server_process.start()
    
    fl.server.start_server(
        server_address=f"{FL_SERVER_IP}:{FL_SERVER_PORT}",
        config=fl.server.ServerConfig(num_rounds=int(args.epoch)),
        strategy=strategy,
        client_manager=client_manager,
    )
    
    # # After the federated learning server stops, also stop the FastAPI server
    # server_process.terminate()
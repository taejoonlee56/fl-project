from collections import defaultdict
from genericpath import isdir
from data_collector_class import collector
from socket import SocketIO
from aiohttp import web
import socketio
import os
import psutil
import json

learning = ""
weahter = ""
map = ""

fl_server_data = defaultdict(list)
fl_client_data = defaultdict(list)

fl_carla_listener_sid = ""

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()
sio.attach(app)


async def index(request):
    with open('index.html') as f:
        return web.Response(text=f.read(), content_type='text/html')

app.router.add_get('/', index)

@sio.on('map_option')
async def map_option(sid, message):
    map = message
    # await sio.emit('get_server_acc', {'key':['0.5','0.7', '0.8']}, room=fl_carla_listener_sid)
    # await sio.emit('get_client_acc', {'client-1':['0.5','0.7', '0.8'], 'client-2':['0.1','0.2', '0.3'], 'client-3':['0.4','0.5', '0.6']}, room=fl_carla_listener_sid)
    change_map(map)

@sio.on('learning')
async def learning_option(sid, message):
    global fl_carla_listener_sid
    print("Socket ID: " , sid)
    print(message, type(message))
    learning_message:dict = message
    server_epoch = ""
    client_epoch = ""
    client_num = ""
    
    for key, item in learning_message.items():
        if "client-number" in key:
            client_num = int(item)
        elif "server-epoch-number" in key:
            server_epoch = int(item)
        elif "client-epoch-number" in key:
            client_epoch = int(item)
    
    await sio.emit('initialize_fl', "init", room=fl_carla_listener_sid)
            
    fl_server(server_epoch, client_epoch, client_num)
        
@sio.on('get_client_acc')
async def get_client_acc(sid, message):
    global fl_carla_listener_sid
    json_data:dict = json.loads(message)
    fl_client_data[json_data['id']].append(json_data['Accuracy'])
    print(fl_client_data)
    await sio.emit('get_client_acc', fl_client_data, room=fl_carla_listener_sid)

@sio.on('get_server_acc')
async def get_server_acc(sid, message):
    global fl_carla_listener_sid
    json_data:dict = json.loads(message)
    fl_server_data['server'].append(json_data['Accuracy'])
    print(fl_server_data)
    await sio.emit('get_server_acc', fl_server_data, room=fl_carla_listener_sid)
    

@sio.on('fl-carla-listener')
async def get_listner_sid(sid, message):
    global fl_carla_listener_sid
    fl_carla_listener_sid = sid
    print("fl-carla-listner online : ", fl_carla_listener_sid)

def change_map(map:dict):
    map_choose = ""
    weather_choose = ""
    for key, ele in map.items():
        if "map" in key:
            map_choose = ele
        if "weather" in key:
            weather_choose = ele
    try:
        for i in range(3):
            os.system(f"nohup python data_collector_class.py -w {weather_choose} -m {map_choose} -n {30}&")        
        
    except KeyboardInterrupt:
        print("\nCancelled by user. Bye!")
        

def fl_server(server_epoch, client_epoch, client_num):
    folder_name = []
    for folder in os.listdir("./"):
        if os.path.isdir(folder) and "pycache" not in folder and "util" not in folder:
            folder_name.append(folder)
    
    try:
        print(f"Fl Starting, Client Number is : {client_num}")
        findKillProcessByName("fl_server.py")
        findKillProcessByName("fl_client.py")
        
        os.system(f"nohup python fl_server.py -e {server_epoch} -n {client_num} > server.out &")
        for folder in folder_name[0:client_num]:
            os.system(f"nohup python fl_client.py -d {folder} -e {client_epoch} > {folder}.out &")
            
        
            
    except KeyboardInterrupt:
        print("\nCancelled by user. Bye!")


def findKillProcessByName(processName):
  for proc in psutil.process_iter():
    try:
      name_list = proc.cmdline()
      if len(name_list) > 1:
        if name_list[0] == 'python' and name_list[1] == processName:
            _pid = proc.pid
            _process = psutil.Process(_pid)
            _process.kill()
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
      pass
    
  return False


## We kick off our server
if __name__ == '__main__':
    web.run_app(app) 
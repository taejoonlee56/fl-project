from fastapi import FastAPI

import subprocess

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/munang")
async def root():
    return {"message": "무냉"}


@app.get("/data-collect")
async def data_collect():
    # subprocess.run() 에 문자열로 변환된 인자를 넘겨줍니다.
    subprocess.run(["/home/tj/anaconda3/envs/torch/bin/python", "../fl-module/data_collector_class.py", "--weather", 'ClearSunset', "--map", 'Town10HD'])
    # subprocess.run(["/path/to/anaconda3/envs/torch/bin/python", "../fl.sh"])
    #    parser.add_argument("-w", "--weather", dest="weather", action="store")          # extra value
        # parser.add_argument("-m", "--map", dest="map", action="store")          # extra value         # extra value
        # parser.add_argument("-n", "--filenumber", dest="number", action="store")      

@app.get("/fl-start")
async def fl_start(e:str = '3', n:str = '3', m:str = '3', s = 'random'):
    try:
        e, n, m = int(e), int(n), int(m)
    except:
        return {"message": "e, n, m must be integer"}
    
    # convert e, n, m to string before passing them to subprocess.run()
    subprocess.Popen(["conda", "run", "-n", "torch", "python", "../fl-module/fl_server.py", "-e", str(e), "-n", str(n), "-m", str(m), '-s', s])

    
    return {"message": "fl_start"}



@app.get("/fl-kill")
async def fl_start():
        
    subprocess.run(["pkill", "-9", "-f", "fl_server.py"])
    
    return {"message": "fl-kill"}

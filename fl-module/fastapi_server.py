from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel

class Message(BaseModel):
    content: dict

class FastAPIServer:
    def __init__(self, host="0.0.0.0", port=8000):
        self.host = host
        self.port = port
        self.app = FastAPI()
        self.messages = []

        @self.app.get("/start")
        def read_root():
            return {"message": "Server started!"}
        
        @self.app.post("/send_battery_info")
        def receive_message(message: Message):
            self.messages.append(message.content)
            return {"Success"}
        
        @self.app.get("/get_battery_info")
        def send_message():
            return {"Message" : self.messages }
            


    def start(self):
        uvicorn.run(self.app, host=self.host, port=self.port)
        
        
    

import random

# 클라이언트 수
num_clients = 10

client_data = {}  # 클라이언트 데이터를 저장할 딕셔너리

for client_id in range(num_clients):
    # 클라이언트의 IP 주소 (가상으로 생성)
    ip_address = f"192.168.0.{client_id + 1}"

    # 배터리 잔량 (0%부터 100% 사이의 임의의 값)
    battery_level = random.randint(0, 100)

    # 배터리 충전 속도 (0부터 10 사이의 임의의 값)
    charge_speed = random.uniform(0, 10)

    # 배터리 충전 전압 (3.0V부터 4.5V 사이의 임의의 값)
    charge_voltage = random.uniform(3.0, 4.5)

    # 클라이언트 데이터를 딕셔너리에 저장
    client_data[ip_address] = {
        "Battery Level": battery_level,
        "Charge Speed": charge_speed,
        "Charge Voltage": charge_voltage
    }

# 딕셔너리 출력
for ip, data in client_data.items():
    print(f"Client {ip}: {data}")

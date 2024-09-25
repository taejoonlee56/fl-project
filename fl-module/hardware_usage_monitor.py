import psutil

def check_hardware_usage():

    # CPU usage
    cpu_percent = psutil.cpu_percent(interval=1)

    # RAM usage
    memory = psutil.virtual_memory()
    ram_percent = memory.percent
    return cpu_percent, ram_percent



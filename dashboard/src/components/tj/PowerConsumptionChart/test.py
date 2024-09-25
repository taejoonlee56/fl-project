import random 

def generate_data():
    row_data = []
    for i in range(5):
        row_data.append(random.uniform(0.2, 0.3))
    return row_data


row_contents = []
for i in range(5):
    result = generate_data()
    row_contents.append(result)

results = []
# for row in row_contents:
#     print(row)
    
# 5개 중 3개 중복 없이 랜덤 고르기
def get_random_data():
    random_data = []
    while len(random_data) < 3:
        random_num = random.randint(0, 4)
        if random_num not in random_data:
            random_data.append(random_num)
    return random_data

targets = []
for i in range(5):
    random_data = get_random_data()
    targets.append(random_data)
    
for i in row_contents:
    print(i)

print(targets)

    # 1,2,4
    # 2,3,4
    # 3,4,5
    # 1,2,3
    # 4,5,2


# 5개 중 3개 고르고
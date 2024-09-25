# rm ./towards.csv

# rm ./towards_data.csv
# rm ./towards_data_selected.csv

# rm ./battery_data.csv
# rm ./battery_data_selected.csv

# rm ./random_data.csv
# rm ./random_data_selected.csv


cp ./battery_info_original.csv ./battery_info.csv

# python fl_client.py -d ./backup/1_data -e 2 &
# python fl_client.py -d ./backup/2_data -e 2 &
# python fl_client.py -d ./backup/3_data -e 2 &
# python fl_client.py -d ./backup/4_data -e 2 &
# python fl_client.py -d ./backup/5_data -e 2 &

python fl_client.py -d ./target_data/1_data -e 3 &
sleep 20
python fl_client.py -d ./target_data/2_data -e 3 &
sleep 20
python fl_client.py -d ./target_data/3_data -e 3 &
sleep 20
python fl_client.py -d ./target_data/4_data -e 3 &
sleep 20
python fl_client.py -d ./target_data/5_data -e 3 &
sleep 20
python fl_client.py -d ./target_data/6_data -e 3 &
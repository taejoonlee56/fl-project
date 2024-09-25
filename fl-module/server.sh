
# rm ./random.csv
# python3 fl_server.py -e 10 -n 6 -m 4 -s random

# rm ./proposed.csv
# python3 fl_server.py -e 10 -n 6 -m 4 -s proposed

# rm ./towards.csv
# python3 fl_server.py -e 10 -n 6 -m 4 -s towards

# rm ./oort.csv
# python3 fl_server.py -e 10 -n 6 -m 4 -s oort

# mv ./random.csv ./backup/random_0.5_0.5.csv
# mv ./proposed.csv ./backup/proposed_0.5_0.5.csv
# mv ./towards.csv ./backup/towards_0.5_0.5.csv
# mv ./oort.csv ./backup/oort_0.5_0.5.csv

# tmux 세션 server에서 실행
# 스크립트에서 사용할 변수 정의
# algorithms=("random" "proposed" "towards" "oort")
# backup_dir="./backup"
# file_prefix=("random" "proposed" "towards" "oort")
# f_values=(0 0 0 0.5 0.5 0.5 1 1 1)
# w_values=(0 0.5 1 0 0.5 1 0 0.5 1)

# file_suffix="_0.5_0.5.csv"

# # proposed.csv, towards.csv, oort.csv 파일 삭제 및 fl_server.py 실행
# for algorithm in "${algorithms[@]}"; do
#     rm "./${algorithm}.csv"
#     tmux send-keys -t client "conda activate torch" Enter
#     tmux send-keys -t client "./spawner.sh" Enter
#     python3 fl_server.py -e 10 -n 6 -m 4 -s "$algorithm"

# done

# # random.csv, proposed.csv, towards.csv, oort.csv 파일 백업
# for prefix in "${file_prefix[@]}"; do
#     mv "./${prefix}.csv" "${backup_dir}/${prefix}${file_suffix}"
# done

backup_dir="./backup"
algorithms=("random" "proposed" "towards" "oort")
file_prefix=("random" "proposed" "towards" "oort")
f_values=(0.5 0.5 0.5 1 1 1)
w_values=(0 0.5 1 0 0.5 1)

# algorithms=("towards" "oort")
# file_prefix=("towards" "oort")
# f_values=(0)
# w_values=(1)

# 먼저 f_values와 w_values의 길이가 같은지 확인하고 진행해야 합니다.
if [ ${#f_values[@]} -eq ${#w_values[@]} ]; then
    for i in "${!f_values[@]}"; do
        f="${f_values[$i]}"
        w="${w_values[$i]}"

        # proposed.csv, towards.csv, oort.csv 파일 삭제 및 fl_server.py 실행
        for algorithm in "${algorithms[@]}"; do
            echo "f: $f, w: $w, algorithm: $algorithm"
            rm "./${algorithm}.csv"
            tmux send-keys -t client "conda activate torch" Enter
            tmux send-keys -t client "./spawner.sh" Enter
            python3 fl_server.py -e 10 -n 6 -m 4 -s "$algorithm" -f "$f" -w "$w"
            file_suffix="_${f}_${w}.csv"
            echo "$backup_dir/$algorhitm"_"$file_suffix"
            mv "./${algorithm}.csv" "${backup_dir}/${algorithm}""${file_suffix}"
            sleep 10
        done

    done
else
    echo "f_values와 w_values의 길이가 다릅니다!"
fi

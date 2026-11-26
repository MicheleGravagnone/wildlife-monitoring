import time
import pika

print(f'Worker started. Pika version {pika.__version__}')
while True:
    print("Waiting for work...")
    time.sleep(5)

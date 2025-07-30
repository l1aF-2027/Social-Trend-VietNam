import time
import datetime

start = int(time.mktime(datetime.datetime(2025, 5, 19, 0, 0, 0).timetuple()))
end = int(time.mktime(datetime.datetime(2025, 5, 20, 20, 29, 59).timetuple()))
print(start, end)
# 1747587600 1748797199 (19/5 - 9/6/2025)
# 1749465000 1749467280 (9/6 - 9/6/2025) (17:30 - 18:08)
# 1747587600 1747747799 (19/5 - 20/5/2025) (0:00 - 20:29)
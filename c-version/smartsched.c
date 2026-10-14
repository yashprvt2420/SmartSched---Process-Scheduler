#include <stdio.h>

#define MAX 10

typedef struct {
    int pid, burst, priority;
} Process;

int fcfs(Process p[], int n) {
    int wait = 0, total = 0;
    for (int i = 0; i < n; i++) {
        total += wait;
        wait += p[i].burst;
    }
    return total / n;
}

int sjf(Process p[], int n) {
    Process a[MAX], temp;
    int wait = 0, total = 0;
    for (int i = 0; i < n; i++) {
        a[i] = p[i];
    }

    for (int i = 0; i < n - 1; i++) {
        for (int j = i + 1; j < n; j++) {
            if (a[i].burst > a[j].burst) {
                temp = a[i];
                a[i] = a[j];
                a[j] = temp;
            }
        }
    }

    for (int i = 0; i < n; i++) {
        total += wait;
        wait += a[i].burst;
    }
    return total / n;
}

int roundRobin(Process p[], int n, int q) {
    int rem[MAX], completion[MAX] = {0};
    int time = 0, done, total = 0;

    for (int i = 0; i < n; i++) {
        rem[i] = p[i].burst;
    }

    do {
        done = 1;
        for (int i = 0; i < n; i++) {
            if (rem[i] > 0) {
                done = 0;
                int run = rem[i] > q ? q : rem[i];
                time += run;
                rem[i] -= run;
                if (rem[i] == 0) {
                    completion[i] = time;
                }
            }
        }
    } while (!done);

    for (int i = 0; i < n; i++) {
        total += completion[i] - p[i].burst;
    }

    return total / n;
}

int priorityScheduling(Process p[], int n) {
    Process a[MAX], temp;
    int wait = 0, total = 0;

    for (int i = 0; i < n; i++) {
        a[i] = p[i];
    }

    for (int i = 0; i < n - 1; i++) {
        for (int j = i + 1; j < n; j++) {
            if (a[i].priority > a[j].priority) {
                temp = a[i];
                a[i] = a[j];
                a[j] = temp;
            }
        }
    }

    for (int i = 0; i < n; i++) {
        total += wait;
        wait += a[i].burst;
    }
    return total / n;
}

int main() {
    Process p[] = {
        {1, 8, 3},
        {2, 4, 1},
        {3, 6, 2},
        {4, 3, 4}
    };
    int n = 4;

    int f = fcfs(p, n);
    int s = sjf(p, n);
    int r = roundRobin(p, n, 2);
    int pr = priorityScheduling(p, n);

    printf("===== SMARTSCHED =====\n");
    printf("CPU Scheduling Simulation\n\n");
    printf("PID\tBurst\tPriority\n");
    for (int i = 0; i < n; i++) {
        printf("P%d\t%d\t%d\n", p[i].pid, p[i].burst, p[i].priority);
    }

    printf("\nAverage Waiting Time:\n");
    printf("FCFS     : %d ms\n", f);
    printf("SJF      : %d ms\n", s);
    printf("Round Robin: %d ms\n", r);
    printf("Priority : %d ms\n", pr);

    int min = f;
    const char *best = "FCFS";

    if (s < min) {
        min = s;
        best = "SJF";
    }
    if (r < min) {
        min = r;
        best = "Round Robin";
    }
    if (pr < min) {
        min = pr;
        best = "Priority";
    }

    printf("\nSmart Decision\n");
    printf("Minimum Waiting Time = %d ms\n", min);
    printf("Selected -> %s\n", best);

    return 0;
}

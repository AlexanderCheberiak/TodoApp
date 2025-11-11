using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class TaskService
{
    private static List<string> _tasks = new List<string>();

    private static List<TaskCompletionSource<List<string>>> _waiters = 
        new List<TaskCompletionSource<List<string>>>();

    public List<string> GetAllTasks()
    {
        return _tasks;
    }

    public Task<List<string>> WaitForUpdatesAsync()
    {
        var tcs = new TaskCompletionSource<List<string>>();
        
        lock (_waiters)
        {
            _waiters.Add(tcs);
        }

        return tcs.Task;
    }

    public void AddTask(string task)
    {
        _tasks.Add(task);

        lock (_waiters)
        {
            foreach (var waiter in _waiters)
            {
                waiter.TrySetResult(new List<string>(_tasks));
            }
            _waiters.Clear();
        }
    }
}
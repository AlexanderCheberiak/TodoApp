using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly TaskService _taskService;
    private readonly IHubContext<TaskHub> _hubContext;

    public TasksController(TaskService taskService, IHubContext<TaskHub> hubContext)
    {
        _taskService = taskService;
        _hubContext = hubContext;
    }

    // Ендпоїнт для Frequent Poll
    // (Просто віддає поточний список)
    [HttpGet]
    public ActionResult<List<string>> GetTasks()
    {
        return _taskService.GetAllTasks();
    }

    //  Ендпоїнт для Long Poll
    // (Чекає на оновлення)
    [HttpGet("longpoll")]
    public async Task<ActionResult<List<string>>> GetTasksLongPoll()
    {
        var tasks = await _taskService.WaitForUpdatesAsync();
        return tasks;
    }

    // Ендпоїнт для додавання завдання
    // (Він "будить" і Long Poll, і Web Sockets)
    [HttpPost]
    public async Task<IActionResult> AddTask([FromBody] string task)
    {
        if (string.IsNullOrEmpty(task))
        {
            return BadRequest("Task cannot be empty");
        }

        _taskService.AddTask(task);

        await _hubContext.Clients.All.SendAsync("TasksUpdated", _taskService.GetAllTasks());

        return Ok();
    }
}
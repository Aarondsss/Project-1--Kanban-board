const lists = {
  todo: document.getElementById('todoList'),
  inprogress: document.getElementById('inprogressList'),
  done: document.getElementById('doneList')
};
const newTaskInput = document.getElementById('newTaskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const stats = document.getElementById('stats');
const toast = document.getElementById('toast');
const template = document.getElementById('taskTemplate');

let dragged = null;
const deleteTimers = new Map();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('show'), 2000);
}

function updateStats() {
  const total = document.querySelectorAll('.task-card').length;
  const done = lists.done.querySelectorAll('.task-card').length;
  stats.textContent = `${total} tasks • ${done} done`;
}

function createTask(text, listType = 'todo') {
  const clone = template.content.firstElementChild.cloneNode(true);
  const card = clone;
  card.dataset.id = crypto.randomUUID();
  card.dataset.state = listType;
  card.querySelector('.task-text').textContent = text;

  const editBtn = card.querySelector('.edit-btn');
  editBtn.addEventListener('click', () => {
    const current = card.querySelector('.task-text').textContent;
    const value = prompt('Edit task', current);
    if (value && value.trim()) {
      card.querySelector('.task-text').textContent = value.trim();
      showToast('Task updated');
    }
  });

  card.addEventListener('dragstart', () => {
    dragged = card;
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    dragged = null;
    card.classList.remove('dragging');
  });

  card.addEventListener('dblclick', () => {
    const next = card.dataset.state === 'todo' ? 'inprogress' : card.dataset.state === 'inprogress' ? 'done' : 'todo';
    moveTask(card, next);
  });

  return card;
}

function moveTask(card, targetList) {
  if (!['todo', 'inprogress', 'done'].includes(targetList)) return;
  const current = card.dataset.state;
  if (current === targetList) return;

  card.dataset.state = targetList;
  lists[targetList].appendChild(card);

  if (targetList === 'done') {
    const existing = deleteTimers.get(card.dataset.id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      if (card.parentElement === lists.done) {
        card.remove();
        showToast('Task removed after done');
        updateStats();
      }
      deleteTimers.delete(card.dataset.id);
    }, 30000);
    deleteTimers.set(card.dataset.id, timer);
    showToast('Moved to Done. Will disappear in 30s.');
  } else {
    const existing = deleteTimers.get(card.dataset.id);
    if (existing) {
      clearTimeout(existing);
      deleteTimers.delete(card.dataset.id);
    }
    showToast('Task moved back to ' + (targetList === 'todo' ? 'To-do' : 'In Process'));
  }

  updateStats();
}

Object.values(lists).forEach(list => {
  list.addEventListener('dragover', (e) => { e.preventDefault(); list.classList.add('dragover'); });
  list.addEventListener('dragleave', () => list.classList.remove('dragover'));
  list.addEventListener('drop', (e) => {
    e.preventDefault();
    list.classList.remove('dragover');
    if (!dragged) return;

    const targetType = list.dataset.list;
    moveTask(dragged, targetType);
    dragged = null;
  });
});

addTaskBtn.addEventListener('click', () => {
  const text = newTaskInput.value.trim();
  if (!text) {
    showToast('Type a task first');
    return;
  }
  const task = createTask(text, 'todo');
  lists.todo.appendChild(task);
  newTaskInput.value = '';
  newTaskInput.focus();
  updateStats();
  showToast('Task added');
});

newTaskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTaskBtn.click();
});

// seed tasks
['Plan morning', 'Work on issue', 'Send review'].forEach(text => {
  const t = createTask(text, 'todo');
  lists.todo.appendChild(t);
});
updateStats();

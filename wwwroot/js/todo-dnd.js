// wwwroot/js/todo-dnd.js
window.todoDnd = {
    onDragStart: function (ev, id) {
        try {
            if (ev && ev.dataTransfer) {
                // спробувати встановити дані у dataTransfer (потрібно в Firefox)
                ev.dataTransfer.setData('text/plain', id);
                ev.dataTransfer.effectAllowed = 'move';
            }
        } catch (e) {
            // ignore
        }
        // запасний механізм: зберігаємо у глобальній змінній
        window._todoDraggedId = id;
    },

    getDraggedId: function () {
        return window._todoDraggedId || null;
    },

    clearDraggedId: function () {
        window._todoDraggedId = null;
    }
};

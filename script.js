class NotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentColor = '#fff7b1';
        this.currentFont = 'Kalam';
        this.currentFontSize = '16';
        this.draggedNote = null;
        this.activeFormats = new Set();
        this.activeNote = null;
        this.institutionThemes = {
            '#fff7b1': 'theme1',
            '#b1e3ff': 'theme2',
            '#ffd1b1': 'theme3',
            '#d1ffb1': 'theme4'
        };
        this.setupEventListeners();
        this.renderNotes();
    }

    setupEventListeners() {
        document.querySelector('.add-btn').addEventListener('click', () => this.addNote());
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => this.handleColorPresetClick(e));
        });
        document.getElementById('noteColor').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        // Font selector event listener
        document.getElementById('fontSelector').addEventListener('change', (e) => {
            this.currentFont = e.target.value;
            if (this.activeNote) {
                this.activeNote.style.fontFamily = this.currentFont;
                const noteId = this.activeNote.closest('.note').dataset.id;
                const note = this.notes.find(n => n.id === parseInt(noteId));
                if (note) {
                    note.font = this.currentFont;
                    this.saveNotes();
                }
            }
        });

        // Font size selector event listener
        document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
            this.currentFontSize = e.target.value;
            if (this.activeNote) {
                this.activeNote.style.fontSize = `${this.currentFontSize}px`;
                const noteId = this.activeNote.closest('.note').dataset.id;
                const note = this.notes.find(n => n.id === parseInt(noteId));
                if (note) {
                    note.fontSize = `${this.currentFontSize}px`;
                    this.saveNotes();
                }
            }
        });

        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFormatClick(e));
        });
    }

    handleColorPresetClick(e) {
        const color = e.target.dataset.color;
        this.currentColor = color;
        document.getElementById('noteColor').value = color;
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    handleFormatClick(e) {
        if (!this.activeNote) return;
        
        const format = e.currentTarget.dataset.format;
        const button = e.currentTarget;
        
        button.classList.toggle('active');
        
        // Apply the style based on the format type
        switch(format) {
            case 'bold':
                this.activeNote.style.fontWeight = button.classList.contains('active') ? 'bold' : 'normal';
                break;
            case 'italic':
                this.activeNote.style.fontStyle = button.classList.contains('active') ? 'italic' : 'normal';
                break;
            case 'underline':
                this.activeNote.style.textDecoration = button.classList.contains('active') ? 'underline' : 'none';
                break;
            case 'strikethrough':
                this.activeNote.style.textDecoration = button.classList.contains('active') ? 'line-through' : 'none';
                break;
        }

        // Save the formatting state
        const noteId = this.activeNote.closest('.note').dataset.id;
        const note = this.notes.find(n => n.id === parseInt(noteId));
        if (note) {
            note.formats = note.formats || {};
            note.formats[format] = button.classList.contains('active');
            this.saveNotes();
        }
    }

    applyFormatsToNote(noteElement) {
        const styles = {
            bold: this.activeFormats.has('bold') ? 'bold' : 'normal',
            italic: this.activeFormats.has('italic') ? 'italic' : 'normal',
            textDecoration: [
                this.activeFormats.has('underline') ? 'underline' : '',
                this.activeFormats.has('strikethrough') ? 'line-through' : ''
            ].filter(Boolean).join(' ') || 'none'
        };

        Object.assign(noteElement.style, {
            fontWeight: styles.bold,
            fontStyle: styles.italic,
            textDecoration: styles.textDecoration
        });

        const noteId = noteElement.closest('.note').dataset.id;
        const note = this.notes.find(n => n.id === parseInt(noteId));
        if (note) {
            note.formats = {
                bold: this.activeFormats.has('bold'),
                italic: this.activeFormats.has('italic'),
                underline: this.activeFormats.has('underline'),
                strikethrough: this.activeFormats.has('strikethrough')
            };
            this.saveNotes();
        }
    }

    applyFormatToActiveNote(property, value) {
        const activeNote = document.activeElement;
        if (activeNote && activeNote.classList.contains('note-content')) {
            activeNote.style[property] = value;
            const noteId = activeNote.closest('.note').dataset.id;
            const note = this.notes.find(n => n.id === parseInt(noteId));
            if (note) {
                if (property === 'fontFamily') note.font = value;
                if (property === 'fontSize') note.fontSize = value;
                this.saveNotes();
            }
        }
    }

    setupNoteEventListeners(noteElement, note) {
        const textarea = noteElement.querySelector('.note-content');
        const deleteBtn = noteElement.querySelector('.note-actions button:last-child');
        const imageBtn = noteElement.querySelector('.note-actions button:first-child');

        textarea.addEventListener('focus', () => {
            this.activeNote = textarea;
            // Update format buttons based on current note's formats
            if (note.formats) {
                Object.entries(note.formats).forEach(([format, isActive]) => {
                    const button = document.querySelector(`.format-btn[data-format="${format}"]`);
                    if (button) {
                        button.classList.toggle('active', isActive);
                        // Apply the saved format
                        switch(format) {
                            case 'bold':
                                textarea.style.fontWeight = isActive ? 'bold' : 'normal';
                                break;
                            case 'italic':
                                textarea.style.fontStyle = isActive ? 'italic' : 'normal';
                                break;
                            case 'underline':
                                textarea.style.textDecoration = isActive ? 'underline' : 'none';
                                break;
                            case 'strikethrough':
                                textarea.style.textDecoration = isActive ? 'line-through' : 'none';
                                break;
                        }
                    }
                });
            }
            // Update font and size selectors
            document.getElementById('fontSelector').value = note.font || this.currentFont;
            document.getElementById('fontSizeSelector').value = note.fontSize ? parseInt(note.fontSize) : this.currentFontSize;
        });

        textarea.addEventListener('blur', () => {
            setTimeout(() => {
                if (!document.activeElement.closest('.format-btn') && 
                    !document.activeElement.closest('.font-selector') && 
                    !document.activeElement.closest('.font-size-selector')) {
                    this.activeNote = null;
                }
            }, 100);
        });

        textarea.addEventListener('input', (e) => {
            note.content = e.target.value;
            this.saveNotes();
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteNote(note.id);
        });

        imageBtn.addEventListener('click', () => {
            this.handleImageUpload(note);
        });

        // Set initial styles
        textarea.style.fontFamily = note.font || this.currentFont;
        textarea.style.fontSize = note.fontSize || `${this.currentFontSize}px`;
        
        // Apply saved formats
        if (note.formats) {
            if (note.formats.bold) textarea.style.fontWeight = 'bold';
            if (note.formats.italic) textarea.style.fontStyle = 'italic';
            if (note.formats.underline) textarea.style.textDecoration = 'underline';
            if (note.formats.strikethrough) textarea.style.textDecoration = 'line-through';
        }

        noteElement.addEventListener('dragstart', (e) => {
            this.draggedNote = noteElement;
            noteElement.classList.add('dragging');
            e.dataTransfer.setData('text/plain', '');
        });

        noteElement.addEventListener('dragend', () => {
            noteElement.classList.remove('dragging');
            this.draggedNote = null;
        });

        noteElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedNote && this.draggedNote !== noteElement) {
                const container = document.querySelector('.notes-container');
                const afterElement = this.getDragAfterElement(container, e.clientY);
                if (afterElement) {
                    container.insertBefore(this.draggedNote, afterElement);
                } else {
                    container.appendChild(this.draggedNote);
                }
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.note:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    handleImageUpload(note) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    note.image = e.target.result;
                    this.saveNotes();
                    this.renderNotes();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    addNote() {
        const note = {
            id: Date.now(),
            content: '',
            color: this.currentColor,
            font: this.currentFont,
            fontSize: `${this.currentFontSize}px`,
            formats: {},
            timestamp: new Date().toISOString()
        };
        this.notes.unshift(note);
        this.saveNotes();
        this.renderNotes();
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
        this.renderNotes();
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    renderNotes() {
        const container = document.querySelector('.notes-container');
        container.innerHTML = '';
        this.notes.forEach(note => {
            container.appendChild(this.createNoteElement(note));
        });
    }

    createNoteElement(note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.style.backgroundColor = note.color;
        noteElement.draggable = true;
        noteElement.dataset.id = note.id;
        noteElement.dataset.institution = this.institutionThemes[note.color] || '';

        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-actions">
                    <button class="note-btn" title="Add Image">📷</button>
                    <button class="note-btn" title="Delete">🗑️</button>
                </div>
            </div>
            <textarea class="note-content" placeholder="Write your note here...">${note.content || ''}</textarea>
            ${note.image ? `<img src="${note.image}" class="note-image" alt="Note image">` : ''}
            <div class="note-timestamp">${new Date(note.timestamp).toLocaleString()}</div>
        `;

        this.setupNoteEventListeners(noteElement, note);
        return noteElement;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new NotesApp();
}); 
/**
 * Aplicación principal para el simulador de autómatas
 */
class AutomataApp {
    constructor() {
        this.parser = new AutomataParser();
        this.visualizer = new AutomataVisualizer('#automataSvg');
        this.currentAutomaton = null;
        this.loadedAutomata = new Map();
        this.loadedGrammars = new Map();
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateUI();
    }

    /**
     * Inicializa las referencias a elementos del DOM
     */
    initializeElements() {
        // Elementos de carga de archivos
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.clearFileBtn = document.getElementById('clearFile');

        // Elementos de tabs
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Elementos de autómatas y gramáticas
        this.automataList = document.getElementById('automataList');
        this.grammarsList = document.getElementById('grammarsList');
        this.automataSelect = document.getElementById('automataSelect');

        // Elementos de conversión
        this.afdToGrSelect = document.getElementById('afdToGrSelect');
        this.convertAfdToGrBtn = document.getElementById('convertAfdToGr');
        this.conversionResult = document.getElementById('conversionResult');

        // Elementos de prueba
        this.wordInput = document.getElementById('wordInput');
        this.testButton = document.getElementById('testButton');
        this.testResult = document.getElementById('testResult');

        // Elementos de visualización
        this.resetZoomBtn = document.getElementById('resetZoom');
        this.centerGraphBtn = document.getElementById('centerGraph');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Drag & Drop para archivos
        this.fileUploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.fileUploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.fileUploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // Carga de archivos
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.clearFileBtn.addEventListener('click', this.clearFile.bind(this));

        // Tabs
        this.tabButtons.forEach(button => {
            button.addEventListener('click', this.handleTabClick.bind(this));
        });

        // Selección de autómata
        this.automataSelect.addEventListener('change', this.handleAutomataSelect.bind(this));

        // Conversiones
        this.convertAfdToGrBtn.addEventListener('click', this.convertAfdToGr.bind(this));
        this.afdToGrSelect.addEventListener('change', this.updateConversionButtons.bind(this));

        // Prueba de palabras
        this.testButton.addEventListener('click', this.testWord.bind(this));
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.testWord();
        });
        this.wordInput.addEventListener('input', this.clearTestResult.bind(this));

        // Controles de visualización
        this.resetZoomBtn.addEventListener('click', () => this.visualizer.resetZoom());
        this.centerGraphBtn.addEventListener('click', () => this.visualizer.centerGraph());

        // Responsive
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Maneja el evento dragover
     */
    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadArea.classList.add('dragover');
    }

    /**
     * Maneja el evento dragleave
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
    }

    /**
     * Maneja el evento drop
     */
    handleDrop(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    /**
     * Maneja la selección de archivo
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Procesa un archivo de autómatas
     */
    async processFile(file) {
        if (!file.name.endsWith('.txt')) {
            this.showError('Por favor selecciona un archivo .txt');
            return;
        }

        try {
            this.showLoading('Cargando archivo...');
            
            const content = await this.readFile(file);
            this.parser.clear();
            this.parser.parseFile(content);
            
            this.loadedAutomata = this.parser.getAutomata();
            this.loadedGrammars = this.parser.getGrammars();
            
            this.updateFileInfo(file.name);
            this.updateAutomataList();
            this.updateGrammarsList();
            this.updateAutomataSelect();
            this.updateConversionSelects();
            this.updateUI();
            
            const totalItems = this.loadedAutomata.size + this.loadedGrammars.size;
            this.showSuccess(`Archivo cargado exitosamente. ${this.loadedAutomata.size} autómata(s) y ${this.loadedGrammars.size} gramática(s) encontrado(s).`);
            
        } catch (error) {
            this.showError(`Error al procesar el archivo: ${error.message}`);
            console.error('Error processing file:', error);
        }
    }

    /**
     * Lee el contenido de un archivo
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Actualiza la información del archivo cargado
     */
    updateFileInfo(filename) {
        this.fileName.textContent = filename;
        this.fileInfo.style.display = 'block';
        this.fileUploadArea.style.display = 'none';
    }

    /**
     * Limpia el archivo cargado
     */
    clearFile() {
        this.fileInput.value = '';
        this.fileInfo.style.display = 'none';
        this.fileUploadArea.style.display = 'block';
        this.parser.clear();
        this.loadedAutomata.clear();
        this.loadedGrammars.clear();
        this.currentAutomaton = null;
        this.updateAutomataList();
        this.updateGrammarsList();
        this.updateAutomataSelect();
        this.updateConversionSelects();
        this.updateUI();
        this.visualizer.clear();
        this.clearTestResult();
        this.conversionResult.textContent = '';
    }

    /**
     * Maneja el clic en las pestañas
     */
    handleTabClick(e) {
        const targetTab = e.target.dataset.tab;
        
        // Actualizar botones
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Actualizar contenido
        this.tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${targetTab}-tab`).classList.add('active');
    }

    /**
     * Actualiza la lista de autómatas
     */
    updateAutomataList() {
        const container = this.automataList;
        container.innerHTML = '';

        if (this.loadedAutomata.size === 0) {
            container.innerHTML = '<p class="no-automata">No hay autómatas cargados</p>';
            return;
        }

        this.loadedAutomata.forEach((automaton, name) => {
            const card = this.createAutomataCard(automaton);
            container.appendChild(card);
        });
    }

    /**
     * Actualiza la lista de gramáticas
     */
    updateGrammarsList() {
        const container = this.grammarsList;
        container.innerHTML = '';

        if (this.loadedGrammars.size === 0) {
            container.innerHTML = '<p class="no-automata">No hay gramáticas cargadas</p>';
            return;
        }

        this.loadedGrammars.forEach((grammar, name) => {
            const card = this.createGrammarCard(grammar);
            container.appendChild(card);
        });
    }

    /**
     * Crea una tarjeta para mostrar información del autómata
     */
    createAutomataCard(automaton) {
        const info = automaton.getInfo();
        const validation = automaton.validate();

        const card = document.createElement('div');
        card.className = 'automata-card';
        
        card.innerHTML = `
            <h4>${info.name}</h4>
            <div class="automata-details">
                <div><strong>Estados:</strong> ${info.states.join(', ')}</div>
                <div><strong>Alfabeto:</strong> ${info.alphabet.join(', ')}</div>
                <div><strong>Estado inicial:</strong> ${info.initialState || 'No definido'}</div>
                <div><strong>Estados finales:</strong> ${info.finalStates.join(', ') || 'Ninguno'}</div>
                <div><strong>Transiciones:</strong> ${info.transitionsCount}</div>
                ${validation.warnings.length > 0 ? 
                    `<div style="color: var(--warning-color); font-size: 0.8rem; margin-top: 0.5rem;">
                        ⚠️ ${validation.warnings.join(', ')}
                    </div>` : ''}
                ${validation.errors.length > 0 ? 
                    `<div style="color: var(--error-color); font-size: 0.8rem; margin-top: 0.5rem;">
                        ❌ ${validation.errors.join(', ')}
                    </div>` : ''}
            </div>
        `;

        return card;
    }

    /**
     * Crea una tarjeta para mostrar información de la gramática
     */
    createGrammarCard(grammar) {
        const info = grammar.getInfo();
        const validation = grammar.validate();

        const card = document.createElement('div');
        card.className = 'grammar-card';
        
        card.innerHTML = `
            <h4>${info.name}</h4>
            <div class="automata-details">
                <div><strong>No terminales:</strong> ${info.nonTerminals.join(', ')}</div>
                <div><strong>Terminales:</strong> ${info.terminals.join(', ')}</div>
                <div><strong>Símbolo inicial:</strong> ${info.startSymbol || 'No definido'}</div>
                <div><strong>Producciones:</strong> ${info.productionsCount}</div>
                <div style="margin-top: 0.5rem; font-size: 0.8rem;">
                    ${info.productions.slice(0, 3).join(', ')}${info.productions.length > 3 ? '...' : ''}
                </div>
                ${validation.warnings.length > 0 ? 
                    `<div style="color: var(--warning-color); font-size: 0.8rem; margin-top: 0.5rem;">
                        ⚠️ ${validation.warnings.join(', ')}
                    </div>` : ''}
                ${validation.errors.length > 0 ? 
                    `<div style="color: var(--error-color); font-size: 0.8rem; margin-top: 0.5rem;">
                        ❌ ${validation.errors.join(', ')}
                    </div>` : ''}
            </div>
        `;

        return card;
    }

    /**
     * Actualiza el select de autómatas
     */
    updateAutomataSelect() {
        const select = this.automataSelect;
        select.innerHTML = '<option value="">Selecciona un autómata</option>';

        this.loadedAutomata.forEach((automaton, name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }

    /**
     * Actualiza los selects de conversión
     */
    updateConversionSelects() {
        // Select AFD -> GR
        const afdSelect = this.afdToGrSelect;
        afdSelect.innerHTML = '<option value="">Selecciona un autómata</option>';
        this.loadedAutomata.forEach((automaton, name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            afdSelect.appendChild(option);
        });
    }

    /**
     * Actualiza el estado de los botones de conversión
     */
    updateConversionButtons() {
        this.convertAfdToGrBtn.disabled = !this.afdToGrSelect.value;
    }

    /**
     * Convierte un AFD a gramática regular
     */
    convertAfdToGr() {
        const selectedName = this.afdToGrSelect.value;
        if (!selectedName || !this.loadedAutomata.has(selectedName)) {
            this.showError('Selecciona un autómata válido');
            return;
        }

        try {
            const automaton = this.loadedAutomata.get(selectedName);
            const grammar = automaton.toRegularGrammar();
            
            // Añadir la gramática a la colección
            this.loadedGrammars.set(grammar.name, grammar);
            
            // Actualizar interfaz
            this.updateGrammarsList();
            this.updateConversionSelects();
            
            // Mostrar resultado
            const info = grammar.getInfo();
            const result = `Gramática Regular generada: ${grammar.name}\n\n` +
                          `No terminales: ${info.nonTerminals.join(', ')}\n` +
                          `Terminales: ${info.terminals.join(', ')}\n` +
                          `Símbolo inicial: ${info.startSymbol}\n\n` +
                          `Producciones:\n${info.productions.join('\n')}`;
            
            this.conversionResult.textContent = result;
            this.showSuccess(`Autómata convertido a gramática regular: ${grammar.name}`);
            
        } catch (error) {
            this.showError(`Error en la conversión: ${error.message}`);
        }
    }


    /**
     * Maneja la selección de un autómata
     */
    handleAutomataSelect(e) {
        const selectedName = e.target.value;
        
        if (selectedName && this.loadedAutomata.has(selectedName)) {
            this.currentAutomaton = this.loadedAutomata.get(selectedName);
            this.visualizer.visualize(this.currentAutomaton);
            this.clearTestResult();
            
            // Centrar el gráfico después de un breve delay
            setTimeout(() => this.visualizer.centerGraph(), 500);
        } else {
            this.currentAutomaton = null;
            this.visualizer.clear();
        }
        
        this.updateUI();
    }

    /**
     * Prueba una palabra con el autómata seleccionado
     */
    testWord() {
        if (!this.currentAutomaton) {
            this.showError('Selecciona un autómata primero');
            return;
        }

        const word = this.wordInput.value.trim();
        if (word === '') {
            this.showError('Ingresa una palabra para probar');
            return;
        }

        try {
            this.showTestResult('testing', 'Procesando...');
            
            // Simular un pequeño delay para mostrar el estado de carga
            setTimeout(() => {
                const result = this.currentAutomaton.recognizeWord(word);
                this.displayTestResult(result);
                
                // Resaltar el camino en la visualización
                if (result.path) {
                    this.visualizer.highlightPath(result.path);
                }
            }, 300);
            
        } catch (error) {
            this.showError(`Error al procesar la palabra: ${error.message}`);
        }
    }

    /**
     * Muestra el resultado de la prueba
     */
    displayTestResult(result) {
        const container = this.testResult;
        
        if (result.error) {
            this.showTestResult('rejected', `❌ Error: ${result.error}`);
            return;
        }

        if (result.accepted) {
            this.showTestResult('accepted', 
                `✅ Palabra "${result.word}" ACEPTADA\n` +
                `Estado final: ${result.finalState}\n` +
                `Pasos: ${result.path.length - 1}`
            );
        } else {
            this.showTestResult('rejected', 
                `❌ Palabra "${result.word}" RECHAZADA\n` +
                `Estado final: ${result.finalState}\n` +
                `Pasos: ${result.path.length - 1}`
            );
        }

        // Mostrar el camino de ejecución
        if (result.path && result.path.length > 1) {
            const pathStr = result.path.map((step, index) => {
                if (index === 0) return step.state;
                return `--${step.symbol}--> ${step.state}`;
            }).join(' ');
            
            const pathElement = document.createElement('div');
            pathElement.style.marginTop = '1rem';
            pathElement.style.fontSize = '0.9rem';
            pathElement.style.fontFamily = 'monospace';
            pathElement.style.background = 'rgba(0,0,0,0.05)';
            pathElement.style.padding = '0.5rem';
            pathElement.style.borderRadius = '0.25rem';
            pathElement.style.overflowX = 'auto';
            pathElement.innerHTML = `<strong>Camino:</strong><br>${pathStr}`;
            
            container.appendChild(pathElement);
        }
    }

    /**
     * Muestra un resultado de prueba con estilo específico
     */
    showTestResult(type, message) {
        const container = this.testResult;
        container.className = `test-result ${type}`;
        container.textContent = message;
    }

    /**
     * Limpia el resultado de la prueba
     */
    clearTestResult() {
        this.testResult.className = 'test-result';
        this.testResult.innerHTML = '';
    }

    /**
     * Actualiza el estado de la UI
     */
    updateUI() {
        const hasAutomata = this.loadedAutomata.size > 0;
        const hasSelected = this.currentAutomaton !== null;

        this.automataSelect.disabled = !hasAutomata;
        this.wordInput.disabled = !hasSelected;
        this.testButton.disabled = !hasSelected;
        
        this.afdToGrSelect.disabled = !hasAutomata;
        this.updateConversionButtons();
    }

    /**
     * Muestra un mensaje de error
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Muestra un mensaje de éxito
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Muestra un mensaje de carga
     */
    showLoading(message) {
        this.showNotification(message, 'loading');
    }

    /**
     * Muestra una notificación
     */
    showNotification(message, type) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Estilos
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            maxWidth: '400px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Colores según el tipo
        switch (type) {
            case 'error':
                notification.style.background = '#dc2626';
                break;
            case 'success':
                notification.style.background = '#059669';
                break;
            case 'loading':
                notification.style.background = '#d97706';
                break;
        }

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover después de un tiempo (excepto loading)
        if (type !== 'loading') {
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        return notification;
    }

    /**
     * Maneja el redimensionamiento de la ventana
     */
    handleResize() {
        const svg = document.getElementById('automataSvg');
        const rect = svg.parentElement.getBoundingClientRect();
        this.visualizer.resize(rect.width, Math.max(400, rect.height));
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.automataApp = new AutomataApp();
    
    // Mensaje de bienvenida
    console.log('🤖 Simulador de Autómatas Finitos Determinísticos iniciado');
    console.log('Desarrollado para el proyecto de Teoría de Autómatas');
});

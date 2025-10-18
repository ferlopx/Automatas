/**
 * Clase que representa un Autómata Finito Determinístico
 */
class FiniteAutomaton {
    constructor(name) {
        this.name = name;
        this.states = new Set();
        this.alphabet = new Set();
        this.initialState = null;
        this.finalStates = new Set();
        this.transitions = new Map(); // Map<string, Map<string, string>>
        this.currentState = null;
        this.executionPath = []; // Para visualización
    }

    /**
     * Establece los estados del autómata
     * @param {string[]} states - Array de nombres de estados
     */
    setStates(states) {
        this.states.clear();
        states.forEach(state => this.states.add(state.trim()));
    }

    /**
     * Establece el alfabeto del autómata
     * @param {string[]} symbols - Array de símbolos del alfabeto
     */
    setAlphabet(symbols) {
        this.alphabet.clear();
        symbols.forEach(symbol => this.alphabet.add(symbol.trim()));
    }

    /**
     * Establece el estado inicial
     * @param {string} state - Estado inicial
     */
    setInitialState(state) {
        const trimmedState = state.trim();
        if (!this.states.has(trimmedState)) {
            throw new Error(`Estado inicial '${trimmedState}' no existe en el conjunto de estados`);
        }
        this.initialState = trimmedState;
    }

    /**
     * Establece los estados finales
     * @param {string[]} states - Array de estados finales
     */
    setFinalStates(states) {
        this.finalStates.clear();
        states.forEach(state => {
            const trimmedState = state.trim();
            if (!this.states.has(trimmedState)) {
                throw new Error(`Estado final '${trimmedState}' no existe en el conjunto de estados`);
            }
            this.finalStates.add(trimmedState);
        });
    }

    /**
     * Añade una transición al autómata
     * @param {string} fromState - Estado origen
     * @param {string} symbol - Símbolo de entrada
     * @param {string} toState - Estado destino
     */
    addTransition(fromState, symbol, toState) {
        const from = fromState.trim();
        const sym = symbol.trim();
        const to = toState.trim();

        // Validaciones
        if (!this.states.has(from)) {
            throw new Error(`Estado origen '${from}' no existe`);
        }
        if (!this.states.has(to)) {
            throw new Error(`Estado destino '${to}' no existe`);
        }
        if (!this.alphabet.has(sym)) {
            throw new Error(`Símbolo '${sym}' no está en el alfabeto`);
        }

        // Crear la estructura de transiciones si no existe
        if (!this.transitions.has(from)) {
            this.transitions.set(from, new Map());
        }

        // Verificar que no haya transiciones múltiples (determinismo)
        if (this.transitions.get(from).has(sym)) {
            console.warn(`Sobrescribiendo transición existente: (${from}, ${sym}) -> ${this.transitions.get(from).get(sym)} con ${to}`);
        }

        this.transitions.get(from).set(sym, to);
    }

    /**
     * Procesa las transiciones desde un string con formato específico
     * @param {string} transitionsStr - String con transiciones separadas por ';'
     */
    setTransitions(transitionsStr) {
        const transitionList = transitionsStr.split(';');
        
        transitionList.forEach(transition => {
            const parts = transition.trim().split(',');
            if (parts.length !== 3) {
                throw new Error(`Formato de transición inválido: '${transition}'. Debe ser 'estado,símbolo,estado'`);
            }
            
            const [fromState, symbol, toState] = parts;
            this.addTransition(fromState, symbol, toState);
        });
    }

    /**
     * Reinicia el autómata al estado inicial
     */
    reset() {
        this.currentState = this.initialState;
        this.executionPath = [];
        if (this.currentState) {
            this.executionPath.push({
                state: this.currentState,
                symbol: null,
                step: 0
            });
        }
    }

    /**
     * Procesa un símbolo de entrada
     * @param {string} symbol - Símbolo a procesar
     * @returns {boolean} - true si la transición fue exitosa
     */
    processSymbol(symbol) {
        if (!this.currentState) {
            throw new Error('El autómata no ha sido inicializado. Llama a reset() primero.');
        }

        if (!this.alphabet.has(symbol)) {
            return false; // Símbolo no reconocido
        }

        const stateTransitions = this.transitions.get(this.currentState);
        if (!stateTransitions || !stateTransitions.has(symbol)) {
            return false; // No hay transición definida
        }

        const nextState = stateTransitions.get(symbol);
        this.currentState = nextState;
        
        this.executionPath.push({
            state: this.currentState,
            symbol: symbol,
            step: this.executionPath.length
        });

        return true;
    }

    /**
     * Verifica si una palabra es aceptada por el autómata
     * @param {string} word - Palabra a verificar
     * @returns {Object} - Resultado del procesamiento
     */
    recognizeWord(word) {
        this.reset();
        
        const result = {
            word: word,
            accepted: false,
            path: [],
            error: null,
            finalState: null
        };

        try {
            // Procesar cada símbolo de la palabra
            for (let i = 0; i < word.length; i++) {
                const symbol = word[i];
                const success = this.processSymbol(symbol);
                
                if (!success) {
                    result.error = `No hay transición definida para el símbolo '${symbol}' desde el estado '${this.currentState}'`;
                    result.path = [...this.executionPath];
                    return result;
                }
            }

            // Verificar si el estado final es de aceptación
            result.accepted = this.finalStates.has(this.currentState);
            result.finalState = this.currentState;
            result.path = [...this.executionPath];

        } catch (error) {
            result.error = error.message;
        }

        return result;
    }

    /**
     * Obtiene información detallada del autómata
     * @returns {Object} - Información del autómata
     */
    getInfo() {
        return {
            name: this.name,
            states: Array.from(this.states),
            alphabet: Array.from(this.alphabet),
            initialState: this.initialState,
            finalStates: Array.from(this.finalStates),
            transitionsCount: Array.from(this.transitions.values())
                .reduce((total, stateTransitions) => total + stateTransitions.size, 0),
            transitions: this.getTransitionsArray()
        };
    }

    /**
     * Obtiene las transiciones como array para visualización
     * @returns {Array} - Array de transiciones
     */
    getTransitionsArray() {
        const transitions = [];
        
        this.transitions.forEach((stateTransitions, fromState) => {
            stateTransitions.forEach((toState, symbol) => {
                transitions.push({
                    from: fromState,
                    symbol: symbol,
                    to: toState
                });
            });
        });

        return transitions;
    }

    /**
     * Valida que el autómata esté completamente definido
     * @returns {Object} - Resultado de la validación
     */
    validate() {
        const errors = [];
        const warnings = [];

        // Verificar que hay estados
        if (this.states.size === 0) {
            errors.push('No se han definido estados');
        }

        // Verificar que hay alfabeto
        if (this.alphabet.size === 0) {
            errors.push('No se ha definido el alfabeto');
        }

        // Verificar estado inicial
        if (!this.initialState) {
            errors.push('No se ha definido el estado inicial');
        }

        // Verificar estados finales
        if (this.finalStates.size === 0) {
            warnings.push('No se han definido estados finales');
        }

        // Verificar completitud de transiciones
        let missingTransitions = 0;
        this.states.forEach(state => {
            this.alphabet.forEach(symbol => {
                if (!this.transitions.has(state) || !this.transitions.get(state).has(symbol)) {
                    missingTransitions++;
                }
            });
        });

        if (missingTransitions > 0) {
            warnings.push(`Faltan ${missingTransitions} transiciones para que el autómata sea completo`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
}

/**
 * Clase que representa una Gramática Regular
 */
class RegularGrammar {
    constructor(name) {
        this.name = name;
        this.nonTerminals = new Set();
        this.terminals = new Set();
        this.startSymbol = null;
        this.productions = new Map(); // Map<string, Array<string>>
    }

    /**
     * Establece los símbolos no terminales
     * @param {string[]} symbols - Array de símbolos no terminales
     */
    setNonTerminals(symbols) {
        this.nonTerminals.clear();
        symbols.forEach(symbol => this.nonTerminals.add(symbol.trim()));
    }

    /**
     * Establece los símbolos terminales
     * @param {string[]} symbols - Array de símbolos terminales
     */
    setTerminals(symbols) {
        this.terminals.clear();
        symbols.forEach(symbol => this.terminals.add(symbol.trim()));
    }

    /**
     * Establece el símbolo inicial
     * @param {string} symbol - Símbolo inicial
     */
    setStartSymbol(symbol) {
        const trimmedSymbol = symbol.trim();
        if (!this.nonTerminals.has(trimmedSymbol)) {
            throw new Error(`Símbolo inicial '${trimmedSymbol}' no existe en los no terminales`);
        }
        this.startSymbol = trimmedSymbol;
    }

    /**
     * Añade una producción a la gramática
     * @param {string} leftSide - Lado izquierdo de la producción
     * @param {string} rightSide - Lado derecho de la producción
     */
    addProduction(leftSide, rightSide) {
        const left = leftSide.trim();
        const right = rightSide.trim();

        if (!this.nonTerminals.has(left)) {
            throw new Error(`Símbolo '${left}' no está en los no terminales`);
        }

        if (!this.productions.has(left)) {
            this.productions.set(left, []);
        }

        this.productions.get(left).push(right);
    }

    /**
     * Procesa las producciones desde un string
     * @param {string} productionsStr - String con producciones separadas por ';'
     */
    setProductions(productionsStr) {
        const productionList = productionsStr.split(';');
        
        productionList.forEach(production => {
            const parts = production.trim().split('->');
            if (parts.length !== 2) {
                throw new Error(`Formato de producción inválido: '${production}'. Debe ser 'A->aB' o 'A->a'`);
            }
            
            const [leftSide, rightSide] = parts;
            this.addProduction(leftSide, rightSide);
        });
    }

    /**
     * Convierte la gramática a un autómata finito
     * @returns {FiniteAutomaton} - Autómata equivalente
     */
    toFiniteAutomaton() {
        const automaton = new FiniteAutomaton(`AFD_${this.name}`);
        
        // Estados = no terminales + estado final adicional
        const states = Array.from(this.nonTerminals);
        const finalState = 'qf';
        states.push(finalState);
        automaton.setStates(states);
        
        // Alfabeto = terminales
        automaton.setAlphabet(Array.from(this.terminals));
        
        // Estado inicial = símbolo inicial
        automaton.setInitialState(this.startSymbol);
        
        // Estados finales = estado final adicional + estados que tienen producciones vacías
        const finalStates = [finalState];
        
        // Procesar producciones
        this.productions.forEach((productions, nonTerminal) => {
            productions.forEach(production => {
                if (production === 'ε' || production === '') {
                    // Producción vacía: el no terminal es final
                    finalStates.push(nonTerminal);
                } else if (production.length === 1 && this.terminals.has(production)) {
                    // Producción A -> a
                    automaton.addTransition(nonTerminal, production, finalState);
                } else if (production.length === 2 && 
                          this.terminals.has(production[0]) && 
                          this.nonTerminals.has(production[1])) {
                    // Producción A -> aB
                    automaton.addTransition(nonTerminal, production[0], production[1]);
                }
            });
        });
        
        automaton.setFinalStates(finalStates);
        return automaton;
    }

    /**
     * Obtiene información de la gramática
     * @returns {Object} - Información de la gramática
     */
    getInfo() {
        const productionsArray = [];
        this.productions.forEach((productions, nonTerminal) => {
            productions.forEach(production => {
                productionsArray.push(`${nonTerminal} -> ${production}`);
            });
        });

        return {
            name: this.name,
            nonTerminals: Array.from(this.nonTerminals),
            terminals: Array.from(this.terminals),
            startSymbol: this.startSymbol,
            productions: productionsArray,
            productionsCount: productionsArray.length
        };
    }

    /**
     * Valida que la gramática esté bien formada
     * @returns {Object} - Resultado de la validación
     */
    validate() {
        const errors = [];
        const warnings = [];

        if (this.nonTerminals.size === 0) {
            errors.push('No se han definido símbolos no terminales');
        }

        if (this.terminals.size === 0) {
            errors.push('No se han definido símbolos terminales');
        }

        if (!this.startSymbol) {
            errors.push('No se ha definido el símbolo inicial');
        }

        if (this.productions.size === 0) {
            errors.push('No se han definido producciones');
        }

        // Verificar que todas las producciones sean regulares (lineales por la derecha)
        this.productions.forEach((productions, nonTerminal) => {
            productions.forEach(production => {
                if (production !== 'ε' && production !== '') {
                    if (production.length > 2) {
                        errors.push(`Producción '${nonTerminal} -> ${production}' no es regular`);
                    } else if (production.length === 2) {
                        if (!this.terminals.has(production[0]) || !this.nonTerminals.has(production[1])) {
                            errors.push(`Producción '${nonTerminal} -> ${production}' tiene formato inválido`);
                        }
                    } else if (production.length === 1) {
                        if (!this.terminals.has(production[0])) {
                            errors.push(`Terminal '${production[0]}' no está definido`);
                        }
                    }
                }
            });
        });

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
}

/**
 * Extensión del FiniteAutomaton para conversión a gramática
 */
FiniteAutomaton.prototype.toRegularGrammar = function() {
    const grammar = new RegularGrammar(`GR_${this.name}`);
    
    // No terminales = estados
    grammar.setNonTerminals(Array.from(this.states));
    
    // Terminales = alfabeto
    grammar.setTerminals(Array.from(this.alphabet));
    
    // Símbolo inicial = estado inicial
    grammar.setStartSymbol(this.initialState);
    
    // Producciones basadas en transiciones
    const productions = [];
    
    this.transitions.forEach((stateTransitions, fromState) => {
        stateTransitions.forEach((toState, symbol) => {
            if (this.finalStates.has(toState)) {
                // Si el estado destino es final, añadir producción A -> a
                productions.push(`${fromState}->${symbol}`);
                // También añadir A -> aB si B no es final
                if (toState !== fromState) {
                    productions.push(`${fromState}->${symbol}${toState}`);
                }
            } else {
                // Producción normal A -> aB
                productions.push(`${fromState}->${symbol}${toState}`);
            }
        });
    });
    
    // Producciones vacías para estados finales
    this.finalStates.forEach(finalState => {
        if (finalState === this.initialState) {
            productions.push(`${finalState}->ε`);
        }
    });
    
    if (productions.length > 0) {
        grammar.setProductions(productions.join(';'));
    }
    
    return grammar;
};

/**
 * Parser para archivos de autómatas y gramáticas
 */
class AutomataParser {
    constructor() {
        this.automata = new Map();
        this.grammars = new Map();
    }

    /**
     * Parsea el contenido de un archivo de autómatas
     * @param {string} content - Contenido del archivo
     * @returns {Map<string, FiniteAutomaton>} - Mapa de autómatas parseados
     */
    parseFile(content) {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        lines.forEach((line, index) => {
            try {
                this.parseLine(line.trim());
            } catch (error) {
                throw new Error(`Error en línea ${index + 1}: ${error.message}`);
            }
        });

        return this.automata;
    }

    /**
     * Parsea una línea individual del archivo
     * @param {string} line - Línea a parsear
     */
    parseLine(line) {
        const parts = line.split(':');
        if (parts.length !== 3) {
            throw new Error(`Formato de línea inválido: '${line}'. Debe ser 'IdInfo:NombreAutomata:Información'`);
        }

        const [idInfo, automatonName, information] = parts;
        const id = parseInt(idInfo.trim());
        const name = automatonName.trim();
        const info = information.trim();

        // Crear autómata si no existe
        if (!this.automata.has(name)) {
            this.automata.set(name, new FiniteAutomaton(name));
        }

        const automaton = this.automata.get(name);

        switch (id) {
            case 1: // Conjunto de estados (AFD) o No terminales (GR)
                const states = info.split(',').map(s => s.trim());
                automaton.setStates(states);
                break;

            case 2: // Símbolos del alfabeto (AFD) o Terminales (GR)
                const symbols = info.split(',').map(s => s.trim());
                automaton.setAlphabet(symbols);
                break;

            case 3: // Estado inicial (AFD) o Símbolo inicial (GR)
                automaton.setInitialState(info);
                break;

            case 4: // Estados finales (AFD) o Estados finales (GR)
                const finalStates = info.split(',').map(s => s.trim());
                automaton.setFinalStates(finalStates);
                break;

            case 5: // Transiciones (AFD) o Producciones (GR)
                automaton.setTransitions(info);
                break;

            // Nuevos IDs para gramáticas regulares
            case 6: // No terminales (GR)
                if (!this.grammars.has(name)) {
                    this.grammars.set(name, new RegularGrammar(name));
                }
                const grammar = this.grammars.get(name);
                const nonTerminals = info.split(',').map(s => s.trim());
                grammar.setNonTerminals(nonTerminals);
                break;

            case 7: // Terminales (GR)
                if (!this.grammars.has(name)) {
                    this.grammars.set(name, new RegularGrammar(name));
                }
                const grammar7 = this.grammars.get(name);
                const terminals = info.split(',').map(s => s.trim());
                grammar7.setTerminals(terminals);
                break;

            case 8: // Símbolo inicial (GR)
                if (!this.grammars.has(name)) {
                    this.grammars.set(name, new RegularGrammar(name));
                }
                const grammar8 = this.grammars.get(name);
                grammar8.setStartSymbol(info);
                break;

            case 9: // Producciones (GR)
                if (!this.grammars.has(name)) {
                    this.grammars.set(name, new RegularGrammar(name));
                }
                const grammar9 = this.grammars.get(name);
                grammar9.setProductions(info);
                break;

            default:
                throw new Error(`ID de información desconocido: ${id}`);
        }
    }

    /**
     * Obtiene todos los autómatas parseados
     * @returns {Map<string, FiniteAutomaton>} - Mapa de autómatas
     */
    getAutomata() {
        return this.automata;
    }

    /**
     * Obtiene todas las gramáticas parseadas
     * @returns {Map<string, RegularGrammar>} - Mapa de gramáticas
     */
    getGrammars() {
        return this.grammars;
    }

    /**
     * Obtiene un autómata específico por nombre
     * @param {string} name - Nombre del autómata
     * @returns {FiniteAutomaton|null} - Autómata o null si no existe
     */
    getAutomaton(name) {
        return this.automata.get(name) || null;
    }

    /**
     * Obtiene una gramática específica por nombre
     * @param {string} name - Nombre de la gramática
     * @returns {RegularGrammar|null} - Gramática o null si no existe
     */
    getGrammar(name) {
        return this.grammars.get(name) || null;
    }

    /**
     * Limpia todos los autómatas y gramáticas parseados
     */
    clear() {
        this.automata.clear();
        this.grammars.clear();
    }
}

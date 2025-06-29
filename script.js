document.addEventListener('DOMContentLoaded', () => {
    let gameData = {};
    let journalData = [];
    let currentTutorialIndex = 0;
    let score = 0;
    let currentChallengeIndex = 1;
    const totalChallenges = 8;

    // Seletores de seções
    const mainMenuSection = document.getElementById('main-menu');
    const journalSection = document.getElementById('journal');
    const tutorialSection = document.getElementById('tutorial');
    const gameplaySection = document.getElementById('gameplay');
    const completionScreen = document.getElementById('completion-screen');
    const allSections = [mainMenuSection, journalSection, tutorialSection, gameplaySection, completionScreen];

    // Seletores de botões
    const showJournalBtn = document.getElementById('show-journal-btn');
    const showTutorialBtn = document.getElementById('show-tutorial-btn');
    const startChallengesBtn = document.getElementById('start-challenges-btn');
    const prevTutorialBtn = document.getElementById('prev-tutorial-btn');
    const nextTutorialBtn = document.getElementById('next-tutorial-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const nextChallengeBtn = document.getElementById('next-challenge-btn');
    const backToMenuFloatingBtn = document.getElementById('back-to-menu-floating-btn');

    // Seletores de conteúdo
    const tutorialContent = document.getElementById('tutorial-content');
    const challengesContainer = document.getElementById('challenges-container');
    const progressBar = document.getElementById('progress-bar');
    
    async function loadAllData() {
        try {
            const [gameResponse, journalResponse] = await Promise.all([
                fetch('./game-data.json'),
                fetch('./jornal-data.json')
            ]);
            if (!gameResponse.ok || !journalResponse.ok) throw new Error(`HTTP error!`);
            
            gameData = await gameResponse.json();
            journalData = await journalResponse.json();
            
            initializeGame();
        } catch (error) {
            console.error("Não foi possível carregar os dados do jogo:", error);
            document.getElementById('game-container').innerHTML = '<p class="text-center text-red-500">Erro ao carregar o jogo. Por favor, tente recarregar a página.</p>';
        }
    }

    function showSection(sectionToShow) {
        allSections.forEach(section => {
            section.classList.toggle('hidden', section !== sectionToShow);
        });
        backToMenuFloatingBtn.classList.toggle('hidden', sectionToShow === mainMenuSection);
    }

    function initializeGame() {
        showJournalBtn.addEventListener('click', () => {
            setupJournal();
            showSection(journalSection);
        });
        showTutorialBtn.addEventListener('click', () => {
            currentTutorialIndex = 0;
            displayTutorial();
            showSection(tutorialSection);
        });
        startChallengesBtn.addEventListener('click', startChallenges);

        prevTutorialBtn.addEventListener('click', () => {
            if (currentTutorialIndex > 0) {
                currentTutorialIndex--;
                displayTutorial();
            }
        });
        nextTutorialBtn.addEventListener('click', () => {
            if (currentTutorialIndex < gameData.tutorialData.length - 1) {
                currentTutorialIndex++;
                displayTutorial();
            }
        });
        startGameBtn.addEventListener('click', startChallenges);
        
        backToMenuFloatingBtn.addEventListener('click', () => showSection(mainMenuSection));
        
        nextChallengeBtn.addEventListener('click', () => {
            currentChallengeIndex++;
            if (currentChallengeIndex <= totalChallenges) {
                displayChallenge(currentChallengeIndex);
                document.getElementById('navigation-buttons').classList.add('hidden');
            } else {
                showCompletion();
            }
        });
        document.getElementById('restart-game-btn').addEventListener('click', () => location.reload());
        
        showSection(mainMenuSection);
    }

    function displayTutorial() {
        const item = gameData.tutorialData[currentTutorialIndex];
        tutorialContent.innerHTML = `<div class="p-4 bg-fefae0 rounded-lg"><h3 class="text-xl font-bold mb-2">${item.title}</h3><p>${item.content}</p></div>`;
        
        prevTutorialBtn.classList.toggle('hidden', currentTutorialIndex === 0);
        nextTutorialBtn.classList.toggle('hidden', currentTutorialIndex === gameData.tutorialData.length - 1);
        startGameBtn.classList.toggle('hidden', currentTutorialIndex !== gameData.tutorialData.length - 1);
    }
    
    function setupJournal() {
        const headlinesList = document.getElementById('headlines-list');
        headlinesList.innerHTML = '<h2>Manchetes</h2>';
        journalData.forEach(article => {
            const headlineDiv = document.createElement('div');
            headlineDiv.textContent = article.title;
            headlineDiv.className = 'headline-item';
            headlineDiv.dataset.id = article.id;
            headlineDiv.addEventListener('click', () => displayArticle(article.id));
            headlinesList.appendChild(headlineDiv);
        });
    }

    function displayArticle(articleId) {
        const article = journalData.find(a => a.id === articleId);
        if (!article) return;

        document.querySelectorAll('.headline-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === articleId);
        });
        
        const paragraphsHTML = article.content.map(p => `<p>${p}</p>`).join('');

        const articleDisplay = document.getElementById('article-display');
        articleDisplay.innerHTML = `
            <h2 class="article-title">${article.title}</h2>
            <div class="article-content-wrapper">
                <div class="article-image-container">
                    <img src="${article.image}" alt="${article.title}">
                </div>
                <div class="article-text-container">
                    ${paragraphsHTML}
                    <div class="article-summary">
                        <h3>Resumo da Matéria</h3>
                        <ul>
                            ${article.summary.map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function startChallenges() {
        showSection(gameplaySection);
        currentChallengeIndex = 1;
        score = 0;
        updateProgressBar(0);
        displayChallenge(currentChallengeIndex);
    }
    
    function displayChallenge(index) {
        challengesContainer.innerHTML = '';
        const challengeData = gameData[`challenge${index}Data`];
        if (!challengeData) return;
        if (challengeData.draggables) setupDragDropChallenge(index, challengeData);
        else if (challengeData.questions) setupFillBlanksChallenge(index, challengeData);
    }

    function setupDragDropChallenge(index, data) {
        const challengeHTML = `
            <div id="challenge-${index}" class="challenge">
                <div class="newspaper-columns">
                    <div class="newspaper-article">
                        <h2 class="article-title">${data.title}</h2>
                        <p class="mb-4">${data.instruction}</p>
                        <div id="drop-zones-${index}" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${data.dropZones.map(zone => `<div class="drop-zone" data-accepts='${JSON.stringify(zone.accepts)}'><h4>${zone.title}</h4></div>`).join('')}
                        </div>
                         <div class="text-center mt-6">
                            <button id="check-challenge-${index}" class="btn-primary">Verificar</button>
                        </div>
                    </div>
                    <aside class="newspaper-sidebar">
                        <div class="space-y-3 p-4 rounded-lg">
                            <h3 class="font-bold text-center mb-2 text-lg">Eventos Perdidos</h3>
                            ${data.draggables.map(item => `<div id="${item.id}" class="draggable" draggable="true">${item.text}</div>`).join('')}
                        </div>
                    </aside>
                </div>
            </div>`;
        challengesContainer.innerHTML = challengeHTML;
        addDragDropListeners(index);
        document.getElementById(`check-challenge-${index}`).addEventListener('click', () => checkDragDropChallenge(index));
    }

    function addDragDropListeners(index) {
        document.querySelectorAll(`#challenge-${index} .draggable`).forEach(item => {
            item.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', e.target.id); setTimeout(() => item.classList.add('opacity-50'), 0); });
            item.addEventListener('dragend', e => e.target.classList.remove('opacity-50'));
        });
        document.querySelectorAll(`#challenge-${index} .drop-zone`).forEach(zone => {
            zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('hover'); });
            zone.addEventListener('dragleave', () => zone.classList.remove('hover'));
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('hover');
                const id = e.dataTransfer.getData('text/plain');
                const draggableElement = document.getElementById(id);
                if (draggableElement) e.target.closest('.drop-zone').appendChild(draggableElement);
            });
        });
    }

    function checkDragDropChallenge(index) {
        const challengeData = gameData[`challenge${index}Data`];
        let correctZones = 0;
        const dropZones = document.querySelectorAll(`#challenge-${index} .drop-zone`);
        
        dropZones.forEach(zone => {
            const acceptedIds = JSON.parse(zone.dataset.accepts);
            const childrenIds = Array.from(zone.querySelectorAll('.draggable')).map(el => el.id);
            const isCorrect = acceptedIds.length === childrenIds.length && acceptedIds.every(id => childrenIds.includes(id));
            
            zone.classList.toggle('correct-drop', isCorrect);
            zone.classList.toggle('incorrect-drop', !isCorrect);
            if(isCorrect) correctZones++;
        });

        if (correctZones === challengeData.dropZones.length) {
            handleCorrectChallenge("Correto! Mais um fragmento da história restaurado.");
        } else {
             // MUDANÇA AQUI: trocando o modal pelo toast de erro
             showToastFeedback("Algumas informações ainda estão incorretas. Tente novamente!", true);
        }
    }

    function setupFillBlanksChallenge(index, data) {
        const challengeHTML = `
            <div id="challenge-${index}" class="challenge newspaper-article-full">
                <h2 class="article-title">${data.title}</h2>
                <p class="mb-6 text-center">${data.instruction}</p>
                <div id="fill-in-blanks-container-${index}" class="space-y-6">
                    ${data.questions.map((q, qIndex) => `
                        <p class="text-lg text-center">
                            ${q.sentence.replace('__________', `
                                <span class="blank-container">
                                    <input type="text" data-answer="${q.answer.toLowerCase()}" data-wrong-attempts="0" class="input-blank">
                                    <span id="explanation-${index}-${qIndex}" class="explanation-text hidden"></span>
                                </span>
                            `)}
                        </p>
                    `).join('')}
                </div>
                <div class="text-center mt-8">
                   <button id="check-challenge-${index}" class="btn-primary">Verificar Respostas</button>
                </div>
            </div>`;
        challengesContainer.innerHTML = challengeHTML;
        document.getElementById(`check-challenge-${index}`).addEventListener('click', () => checkFillBlanksChallenge(index));
    }
    
    function checkFillBlanksChallenge(index) {
        const inputs = document.querySelectorAll(`#challenge-${index} input`);
        const questionsData = gameData[`challenge${index}Data`].questions;
        let allCorrect = true;

        inputs.forEach((input, qIndex) => {
            if (input.disabled) return;
            const userAnswer = input.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const correctAnswer = input.dataset.answer.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            if (userAnswer === correctAnswer) {
                input.classList.remove('border-red-500');
                input.classList.add('border-green-500');
                input.disabled = true;
            } else {
                input.classList.remove('border-green-500');
                input.classList.add('border-red-500');
                allCorrect = false;

                let wrongAttempts = parseInt(input.dataset.wrongAttempts, 10) + 1;
                input.dataset.wrongAttempts = wrongAttempts;

                if (wrongAttempts >= 3) {
                    const explanationSpan = document.getElementById(`explanation-${index}-${qIndex}`);
                    const questionData = questionsData[qIndex];
                    input.value = questionData.answer.toUpperCase();
                    input.disabled = true;
                    explanationSpan.innerHTML = `<br><b>Resposta:</b> ${questionData.answer}.<br><i>${questionData.explanation}</i>`;
                    explanationSpan.classList.remove('hidden');
                }
            }
        });
        
        const allAnswered = Array.from(inputs).every(input => input.disabled);

        if (allAnswered) {
            handleCorrectChallenge("Excelente! Os fatos foram corrigidos com precisão.");
        } else if (!allCorrect) {
            // MUDANÇA AQUI: trocando o modal pelo toast de erro
            showToastFeedback("Algumas informações ainda estão incorretas. Tente novamente!", true);
        }
    }

    function handleCorrectChallenge(message) {
        const points = 100 / totalChallenges;
        score += points;
        updateProgressBar(score);
        showToastFeedback(message, false); // Passando 'false' para garantir a cor padrão de sucesso
        document.getElementById('navigation-buttons').classList.remove('hidden');
    }

    // MUDANÇA AQUI: A função agora aceita um segundo parâmetro para indicar se é um erro
    function showToastFeedback(message, isError = false) {
        const toast = document.getElementById('toast-popup');
        toast.textContent = message;
        
        // Adiciona ou remove a classe de erro
        if (isError) {
            toast.classList.add('error');
        } else {
            toast.classList.remove('error');
        }

        toast.className = "show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
    }

    function updateProgressBar(value) {
        progressBar.style.width = `${value}%`;
    }

    function showCompletion() {
        showSection(completionScreen);
        document.getElementById('final-score').textContent = Math.round(score);
        let level = 'Iniciante';
        if (score >= 99) level = 'Mestre do Tempo';
        else if (score >= 60) level = 'Guardião Experiente';
        else if (score >= 30) level = 'Aprendiz de História';
        document.getElementById('knowledge-level').textContent = level;
    }
    
    loadAllData();
});
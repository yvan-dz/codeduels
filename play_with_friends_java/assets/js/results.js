document.addEventListener('DOMContentLoaded', function () {
    const resultData = JSON.parse(localStorage.getItem('resultData'));
    if (!resultData) {
        window.location.href = 'index.html';
        return;
    }

    const player1Results = document.getElementById('player1-results');
    const player2Results = document.getElementById('player2-results');
    const gameResult = document.getElementById('game-result');

    player1Results.innerHTML = `
        <h2>Player 1</h2>
        <p>User ID: ${resultData.player1.userId}</p>
        <p>Output:</p>
        <pre>${resultData.player1.output}</pre>
    `;

    player2Results.innerHTML = `
        <h2>Player 2</h2>
        <p>User ID: ${resultData.player2.userId}</p>
        <p>Output:</p>
        <pre>${resultData.player2.output}</pre>
    `;

    gameResult.innerHTML = `
        <h2>Game Result</h2>
        <p>${resultData.player1.won ? 'Player 1' : 'Player 2'} wins!</p>
    `;
});

const socket = io();

const joinBtn =
    document.getElementById("joinBtn");

const createRoomBtn =
    document.getElementById("createRoomBtn");

const currentRoom =
    document.getElementById("currentRoom");

const playersList =
    document.getElementById("players");

const startBtn =
    document.getElementById("startBtn");

const status =
    document.getElementById("status");

const question =
    document.getElementById("question");

const submitBtn =
    document.getElementById("submitBtn");

const answerBox =
    document.getElementById("answer");

const answersList =
    document.getElementById("answers");

const votePlayer =
    document.getElementById("votePlayer");

const voteBtn =
    document.getElementById("voteBtn");

const winner =
    document.getElementById("winner");

const phase =
    document.getElementById("phase");

let myName = "";

// CREATE ROOM

createRoomBtn.addEventListener(
    "click",
    () => {

        console.log("CREATE BUTTON CLICKED");
        const name =
            document
                .getElementById("name")
                .value;

        if (
            name.trim() === ""
        ) {
            return;
        }

        myName = name;

        status.textContent =
            "Waiting...";

        question.textContent =
            "";

        winner.textContent =
            "";

        answersList.innerHTML =
            "";

        submitBtn.disabled =
            false;

        voteBtn.disabled =
            false;

        socket.emit(
            "create-room",
            name
        );

    }
);

// ROOM CREATED

socket.on(
    "room-created",
    (roomCode) => {

        document
            .getElementById(
                "roomCode"
            ).value = roomCode;

        currentRoom.textContent =
            `Joined Room: ${roomCode}`;

    }
);

// JOIN EXISTING ROOM

joinBtn.addEventListener(
    "click",
    () => {

        const roomCode =
            document
                .getElementById(
                    "roomCode"
                )
                .value;

        const name =
            document
                .getElementById(
                    "name"
                )
                .value;

        if (
            roomCode.trim() === "" ||
            name.trim() === ""
        ) {
            return;
        }

        myName = name;

        status.textContent =
            "Waiting...";

        question.textContent =
            "";

        winner.textContent =
            "";

        answersList.innerHTML =
            "";

        submitBtn.disabled =
            false;

        voteBtn.disabled =
            false;

        currentRoom.textContent =
            `Joined Room: ${roomCode.toUpperCase()}`;

        socket.emit(
            "join-game",
            {
                name,
                roomCode
            }
        );

    }
);

// PLAYER LIST

socket.on(
    "player-list",
    (players) => {

        playersList.innerHTML =
            "";

        votePlayer.innerHTML =
            "";

        players.forEach(
            (player) => {

                const li =
                    document.createElement(
                        "li"
                    );

                li.textContent =
                    player;

                playersList.appendChild(
                    li
                );

                // No self vote

                if (
                    player !== myName
                ) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        player;

                    option.textContent =
                        player;

                    votePlayer.appendChild(
                        option
                    );

                }

            }
        );

    }
);

// START GAME

startBtn.addEventListener(
    "click",
    () => {

        socket.emit(
            "start-game"
        );

    }
);

// PHASES

socket.on(
    "phase",
    (text) => {

        phase.textContent =
            text;

        if (
            text ===
            "Phase 1: Waiting For Players"
        ) {

            submitBtn.disabled =
                false;

            voteBtn.disabled =
                false;

            answerBox.value =
                "";

        }

    }
);

// ROLE

socket.on(
    "role",
    (role) => {

        submitBtn.disabled =
            false;

        voteBtn.disabled =
            false;

        winner.textContent =
            "";

        if (
            role === "Hacker"
        ) {

            status.textContent =
                "🔴 You are the Hacker";

        } else {

            status.textContent =
                "🔵 You are an Analyst";

        }

    }
);

// TOPIC

socket.on(
    "topic",
    (topic) => {

        question.textContent =
            topic;

    }
);

// SUBMIT CLUE

submitBtn.addEventListener(
    "click",
    () => {

        const clue =
            answerBox.value.trim();

        if (
            clue === ""
        ) {
            return;
        }

        socket.emit(
            "submit-answer",
            {
                player: myName,
                answer: clue
            }
        );

        submitBtn.disabled =
            true;

        answerBox.value =
            "";

    }
);

// CLUE LIST

socket.on(
    "answer-list",
    (answers) => {

        answersList.innerHTML =
            "";

        answers.forEach(
            (entry) => {

                const li =
                    document.createElement(
                        "li"
                    );

                li.textContent =
                    `${entry.player}: ${entry.answer}`;

                answersList.appendChild(
                    li
                );

            }
        );

    }
);

// VOTE

voteBtn.addEventListener(
    "click",
    () => {

        const suspect =
            votePlayer.value;

        if (!suspect) {
            return;
        }

        socket.emit(
            "submit-vote",
            suspect
        );

        voteBtn.disabled =
            true;

    }
);

// WINNER

socket.on(
    "winner",
    (message) => {

        winner.textContent =
            message;

    }
);

// DEBUG

socket.on(
    "connect",
    () => {

        console.log(
            "Connected to server"
        );

    }
);

socket.on(
    "disconnect",
    () => {

        console.log(
            "Disconnected from server"
        );

    }
);
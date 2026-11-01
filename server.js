const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function generateRoomCode() {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";

    for (let i = 0; i < 4; i++) {

        code += chars[
            Math.floor(
                Math.random() * chars.length
            )
        ];

    }

    return code;

}

const topics = [

    "VPN",
    "Firewall",
    "Phishing",
    "Password Manager",
    "Malware",

    "Wireshark",
    "Nmap",
    "Kali Linux",
    "Metasploit",
    "Burp Suite",

    "Linux",
    "Windows",
    "SOC",
    "Threat Hunting",
    "Ransomware",

    "Spyware",
    "Trojan",
    "DNS",
    "MFA",
    "Encryption",

    "Hashing",
    "SQL Injection",
    "XSS",
    "Botnet",
    "Forensics",

    "Zero-Day",
    "Antivirus",
    "Cloud Security",
    "Incident Response",
    "Vulnerability Scan"

];

io.on("connection", (socket) => {

    // CREATE ROOM

    socket.on("create-room", (playerName) => {

        let roomCode =
            generateRoomCode();

        while (
            rooms[roomCode]
        ) {

            roomCode =
                generateRoomCode();

        }

        rooms[roomCode] = {

            players: {},
            hacker: "",
            topic: "",

            answers: [],
            votes: {},
            answersSubmitted: {},

            gameStarted: false

        };

        socket.roomCode = roomCode;
        socket.playerName = playerName;

        socket.join(roomCode);

        rooms[roomCode]
            .players[socket.id] =
            playerName;

        socket.emit(
            "room-created",
            roomCode
        );

        io.to(roomCode).emit(
            "player-list",

            Object.values(
                rooms[roomCode].players
            )
        );

    });

    // JOIN ROOM

    socket.on("join-game", (data) => {

        const roomCode =
            data.roomCode
                .toUpperCase();

        const playerName =
            data.name;

        socket.roomCode = roomCode;
        socket.playerName = playerName;

        if (
            !rooms[roomCode]
        ) {

            socket.emit(
                "topic",
                "Room not found."
            );

            return;

        }

        if (
            rooms[roomCode]
                .gameStarted
        ) {

            socket.emit(
                "topic",
                "Game already started. Join another room."
            );

            return;

        }

        if (

            Object.keys(
                rooms[roomCode]
                    .players
            ).length >= 8

        ) {

            socket.emit(
                "topic",
                "Room is full (Maximum 8 players)."
            );

            return;

        }

        socket.join(roomCode);

        rooms[roomCode]
            .players[socket.id] =
            playerName;

        io.to(roomCode).emit(
            "player-list",

            Object.values(
                rooms[roomCode]
                    .players
            )
        );

    });

    // START GAME

    socket.on("start-game", () => {

        const roomCode =
            socket.roomCode;

        if (!roomCode) return;

        const room =
            rooms[roomCode];

        if (!room) return;

        if (
            room.gameStarted
        ) {
            return;
        }

        const playerNames =
            Object.values(
                room.players
            );

        if (
            playerNames.length < 3
        ) {

            io.to(socket.id).emit(
                "topic",
                "Need at least 3 players."
            );

            return;

        }

        room.gameStarted = true;

        room.answers = [];
        room.votes = {};
        room.answersSubmitted = {};

        room.hacker =

            playerNames[
                Math.floor(
                    Math.random() *
                    playerNames.length
                )
            ];

        room.topic =

            topics[
                Math.floor(
                    Math.random() *
                    topics.length
                )
            ];

        for (

            const [id, name]

            of Object.entries(
                room.players
            )

        ) {

            if (
                name === room.hacker
            ) {

                io.to(id).emit(
                    "role",
                    "Hacker"
                );

                io.to(id).emit(
                    "topic",
                    "Unknown Topic"
                );

            } else {

                io.to(id).emit(
                    "role",
                    "Analyst"
                );

                io.to(id).emit(
                    "topic",
                    room.topic
                );

            }

        }

        io.to(roomCode).emit(
            "phase",
            "Phase 3: Submit Your Clue"
        );

    });

    // SUBMIT CLUE

    socket.on(
        "submit-answer",
        (data) => {

            const roomCode =
                socket.roomCode;

            if (!roomCode)
                return;

            const room =
                rooms[roomCode];

            if (!room)
                return;

            // Prevent duplicate clue

            if (
                room.answersSubmitted[
                    socket.id
                ]
            ) {
                return;
            }

            room.answers.push(
                data
            );

            room.answersSubmitted[
                socket.id
            ] = true;

            io.to(roomCode).emit(
                "answer-list",
                room.answers
            );

            const submittedCount =

                Object.keys(
                    room.answersSubmitted
                ).length;

            const playerCount =

                Object.keys(
                    room.players
                ).length;

            if (
                submittedCount ===
                playerCount
            ) {

                io.to(roomCode).emit(
                    "phase",
                    "Phase 4: Voting"
                );

                io.to(roomCode).emit(
                    "topic",
                    "All clues submitted. Vote for the Hacker."
                );

            }

        }
    );

    // SUBMIT VOTE

    socket.on(
        "submit-vote",
        (suspect) => {

            const roomCode =
                socket.roomCode;

            if (!roomCode)
                return;

            const room =
                rooms[roomCode];

            if (!room)
                return;

            // Prevent duplicate vote

            if (
                room.votes[
                    socket.id
                ]
            ) {
                return;
            }

            room.votes[
                socket.id
            ] = suspect;

            socket.emit(
                "phase",
                "Phase 5: Waiting For Votes"
            );

            const totalVotes =

                Object.keys(
                    room.votes
                ).length;

            const totalPlayers =

                Object.keys(
                    room.players
                ).length;

            if (
                totalVotes ===
                totalPlayers
            ) {

                const voteCount =
                    {};

                Object.values(
                    room.votes
                ).forEach(
                    (vote) => {

                        voteCount[vote] =

                            (
                                voteCount[vote]
                                || 0
                            ) + 1;

                    }
                );

                let suspectPlayer =
                    "";

                let highestVotes =
                    0;

                for (

                    const player
                    in voteCount

                ) {

                    if (

                        voteCount[
                            player
                        ] >

                        highestVotes

                    ) {

                        highestVotes =

                            voteCount[
                                player
                            ];

                        suspectPlayer =
                            player;

                    }

                }

                let result =
                    "";

                if (

                    suspectPlayer ===
                    room.hacker

                ) {

                    result =

                        `🏆 Analysts Win! Hacker was ${room.hacker}`;

                } else {

                    result =

                        `🏆 Hacker Wins! Hacker was ${room.hacker}`;

                }

                io.to(roomCode).emit(
                    "phase",
                    "Phase 6: Game Complete"
                );

                io.to(roomCode).emit(
                    "winner",
                    result
                );

                room.gameStarted =
                    false;

                room.answers = [];
                room.votes = {};
                room.answersSubmitted =
                    {};

                room.hacker = "";
                room.topic = "";

                setTimeout(() => {

                    io.to(
                        roomCode
                    ).emit(
                        "phase",
                        "Phase 1: Waiting For Players"
                    );

                }, 5000);

            }

        }
    );

    // DISCONNECT

    socket.on(
        "disconnect",
        () => {

            const roomCode =
                socket.roomCode;

            if (!roomCode)
                return;

            if (
                !rooms[
                    roomCode
                ]
            ) {
                return;
            }

            delete rooms[
                roomCode
            ].players[
                socket.id
            ];

            delete rooms[
                roomCode
            ].votes[
                socket.id
            ];

            delete rooms[
                roomCode
            ].answersSubmitted[
                socket.id
            ];

            io.to(roomCode).emit(

                "player-list",

                Object.values(
                    rooms[roomCode]
                        .players
                )

            );

            if (

                Object.keys(
                    rooms[roomCode]
                        .players
                ).length === 0

            ) {

                delete rooms[
                    roomCode
                ];

            }

        }
    );

});

const PORT =
    process.env.PORT || 3000;

server.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);
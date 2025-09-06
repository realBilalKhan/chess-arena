import chalk from "chalk";

class OpeningDetector {
  constructor() {
    this.openings = this.initializeOpenings();
    this.detectedOpening = null;
    this.lastCheckedMoveCount = 0;
  }

  initializeOpenings() {
    return {
      "1.e4": "King's Pawn Opening",
      "1.e4 e5": "King's Pawn Game",
      "1.e4 e5 2.Nf3": "King's Knight Opening",
      "1.e4 e5 2.Nf3 Nc6": "King's Knight Opening",
      "1.e4 e5 2.Nf3 Nc6 3.Bb5": "Spanish Opening (Ruy Lopez)",
      "1.e4 e5 2.Nf3 Nc6 3.Bc4": "Italian Game",
      "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5": "Italian Game: Classical Variation",
      "1.e4 e5 2.Nf3 Nc6 3.Bc4 f5": "Italian Game: Rousseau Gambit",
      "1.e4 e5 2.Nf3 Nc6 3.d4": "Scotch Game",
      "1.e4 e5 2.Nf3 Nc6 3.d4 exd4": "Scotch Game",
      "1.e4 e5 2.Nf3 Nc6 3.Nc3": "Three Knights Opening",
      "1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6": "Four Knights Game",
      "1.e4 e5 2.f4": "King's Gambit",
      "1.e4 e5 2.f4 exf4": "King's Gambit Accepted",
      "1.e4 e5 2.f4 Bc5": "King's Gambit Declined: Classical Defense",
      "1.e4 e5 2.Bc4": "Bishop's Opening",
      "1.e4 e5 2.Qh5": "Napoleon Attack",

      "1.e4 c5": "Sicilian Defense",
      "1.e4 c5 2.Nf3": "Sicilian Defense: Open",
      "1.e4 c5 2.Nf3 d6": "Sicilian Defense: Najdorf Variation",
      "1.e4 c5 2.Nf3 Nc6": "Sicilian Defense: Open",
      "1.e4 c5 2.Nf3 Nc6 3.d4": "Sicilian Defense: Open",
      "1.e4 c5 2.Nf3 Nc6 3.d4 cxd4": "Sicilian Defense: Open",
      "1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4": "Sicilian Defense: Open",
      "1.e4 c5 2.Nc3": "Sicilian Defense: Closed",
      "1.e4 c5 2.c3": "Sicilian Defense: Alapin Variation",
      "1.e4 c5 2.f4": "Sicilian Defense: Grand Prix Attack",

      "1.e4 e6": "French Defense",
      "1.e4 e6 2.d4": "French Defense",
      "1.e4 e6 2.d4 d5": "French Defense",
      "1.e4 e6 2.d4 d5 3.Nc3": "French Defense: Classical Variation",
      "1.e4 e6 2.d4 d5 3.Nd2": "French Defense: Tarrasch Variation",
      "1.e4 e6 2.d4 d5 3.e5": "French Defense: Advance Variation",
      "1.e4 e6 2.d4 d5 3.exd5": "French Defense: Exchange Variation",

      "1.e4 c6": "Caro-Kann Defense",
      "1.e4 c6 2.d4": "Caro-Kann Defense",
      "1.e4 c6 2.d4 d5": "Caro-Kann Defense",
      "1.e4 c6 2.d4 d5 3.Nc3": "Caro-Kann Defense: Classical Variation",
      "1.e4 c6 2.d4 d5 3.e5": "Caro-Kann Defense: Advance Variation",
      "1.e4 c6 2.d4 d5 3.exd5": "Caro-Kann Defense: Exchange Variation",

      "1.e4 Nf6": "Alekhine's Defense",
      "1.e4 Nf6 2.e5": "Alekhine's Defense",
      "1.e4 Nf6 2.e5 Nd5": "Alekhine's Defense",

      "1.e4 d6": "Pirc Defense",
      "1.e4 d6 2.d4": "Pirc Defense",
      "1.e4 d6 2.d4 Nf6": "Pirc Defense",
      "1.e4 d6 2.d4 Nf6 3.Nc3": "Pirc Defense",
      "1.e4 d6 2.d4 Nf6 3.Nc3 g6": "Pirc Defense",

      "1.d4": "Queen's Pawn Opening",
      "1.d4 d5": "Queen's Pawn Game",
      "1.d4 d5 2.c4": "Queen's Gambit",
      "1.d4 d5 2.c4 dxc4": "Queen's Gambit Accepted",
      "1.d4 d5 2.c4 e6": "Queen's Gambit Declined",
      "1.d4 d5 2.c4 e6 3.Nc3": "Queen's Gambit Declined",
      "1.d4 d5 2.c4 e6 3.Nc3 Nf6": "Queen's Gambit Declined",
      "1.d4 d5 2.c4 c6": "Queen's Gambit Declined: Slav Defense",
      "1.d4 d5 2.c4 Nc6": "Queen's Gambit Declined: Chigorin Defense",

      "1.d4 Nf6": "Indian Defense",
      "1.d4 Nf6 2.c4": "Indian Defense",
      "1.d4 Nf6 2.c4 e6": "Indian Defense",
      "1.d4 Nf6 2.c4 e6 3.Nc3": "Indian Defense",
      "1.d4 Nf6 2.c4 e6 3.Nc3 Bb4": "Nimzo-Indian Defense",

      "1.d4 Nf6 2.c4 g6": "King's Indian Defense",
      "1.d4 Nf6 2.c4 g6 3.Nc3": "King's Indian Defense",
      "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7": "King's Indian Defense",
      "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4": "King's Indian Defense",
      "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6": "King's Indian Defense",

      "1.d4 Nf6 2.c4 e6 3.Nf3": "Queen's Indian Defense",
      "1.d4 Nf6 2.c4 e6 3.Nf3 b6": "Queen's Indian Defense",

      "1.d4 Nf6 2.c4 c5": "Benoni Defense",
      "1.d4 c5": "Benoni Defense",

      "1.d4 Nf6 2.c4 g6 3.Nc3 d5": "Grünfeld Defense",

      "1.d4 f5": "Dutch Defense",
      "1.d4 f5 2.g3": "Dutch Defense: Leningrad Variation",
      "1.d4 f5 2.c4": "Dutch Defense",
      "1.d4 f5 2.Nf3": "Dutch Defense",

      "1.c4": "English Opening",
      "1.c4 e5": "English Opening: King's English Variation",
      "1.c4 Nf6": "English Opening",
      "1.c4 c5": "English Opening: Symmetrical Variation",
      "1.c4 e6": "English Opening",
      "1.c4 c6": "English Opening",

      "1.Nf3": "Réti Opening",
      "1.Nf3 d5": "Réti Opening",
      "1.Nf3 Nf6": "Réti Opening",
      "1.Nf3 d5 2.c4": "Réti Opening",

      "1.f4": "Bird's Opening",
      "1.f4 d5": "Bird's Opening",
      "1.f4 e5": "Bird's Opening: From's Gambit",

      "1.b3": "Larsen's Opening",
      "1.g3": "Benko's Opening",
      "1.Nc3": "Van Geet Opening",
      "1.e3": "Van't Kruijs Opening",
      "1.d3": "Mieses Opening",
      "1.h4": "Desprez Opening",
      "1.a4": "Ware Opening",
      "1.b4": "Polish Opening (Sokolsky Opening)",
      "1.g4": "Grob's Attack",
      "1.h3": "Clemenz Opening",
      "1.f3": "Gedult Opening",
      "1.c3": "Saragossa Opening",
      "1.a3": "Anderssen's Opening",
      "1.Na3": "Durkin Opening",
      "1.Nh3": "Amar Opening",
    };
  }

  convertToStandardNotation(history) {
    const moves = [];
    let moveNumber = 1;

    for (let i = 0; i < history.length; i += 2) {
      const whiteMove = history[i];
      const blackMove = history[i + 1];

      if (whiteMove) {
        if (blackMove) {
          moves.push(`${moveNumber}.${whiteMove} ${blackMove}`);
        } else {
          moves.push(`${moveNumber}.${whiteMove}`);
        }
        moveNumber++;
      }
    }

    return moves.join(" ");
  }

  getOpeningSequence(history, maxMoves = 8) {
    const sequences = [];

    for (let i = 1; i <= Math.min(history.length, maxMoves); i++) {
      let sequence = "";
      let moveNumber = 1;

      for (let j = 0; j < i; j += 2) {
        const whiteMove = history[j];
        const blackMove = history[j + 1];

        if (whiteMove) {
          if (j > 0) sequence += " ";
          sequence += `${moveNumber}.${whiteMove}`;

          if (blackMove && j + 1 < i) {
            sequence += ` ${blackMove}`;
          }
          moveNumber++;
        }
      }

      sequences.push(sequence);
    }

    return sequences;
  }

  detectOpening(chess) {
    const history = chess.history();
    const moveCount = history.length;

    if (moveCount > 16 || moveCount === 0) {
      return null;
    }

    if (moveCount <= this.lastCheckedMoveCount && this.detectedOpening) {
      return this.detectedOpening;
    }

    this.lastCheckedMoveCount = moveCount;

    const sequences = this.getOpeningSequence(history, 8);

    for (let i = sequences.length - 1; i >= 0; i--) {
      const sequence = sequences[i];

      if (this.openings[sequence]) {
        const opening = {
          name: this.openings[sequence],
          moves: sequence,
          moveCount: moveCount,
          isNew:
            !this.detectedOpening ||
            this.detectedOpening.name !== this.openings[sequence],
        };

        this.detectedOpening = opening;
        return opening;
      }
    }

    if (moveCount >= 1) {
      const firstMove = history[0];
      let generalOpening = null;

      if (firstMove === "e4") {
        generalOpening = "King's Pawn Opening";
      } else if (firstMove === "d4") {
        generalOpening = "Queen's Pawn Opening";
      } else if (firstMove === "Nf3") {
        generalOpening = "King's Knight Opening";
      } else if (firstMove === "c4") {
        generalOpening = "English Opening";
      }

      if (
        generalOpening &&
        (!this.detectedOpening || this.detectedOpening.name !== generalOpening)
      ) {
        const opening = {
          name: generalOpening,
          moves: `1.${firstMove}`,
          moveCount: moveCount,
          isNew: true,
        };

        this.detectedOpening = opening;
        return opening;
      }
    }

    return this.detectedOpening;
  }

  displayOpeningInfo(opening) {
    if (!opening || !opening.isNew) {
      return;
    }

    console.log(chalk.cyan.bold(`\n📚 Opening Detected: ${opening.name}`));
    console.log(chalk.gray(`   Moves: ${opening.moves}\n`));
  }

  reset() {
    this.detectedOpening = null;
    this.lastCheckedMoveCount = 0;
  }

  getCurrentOpening() {
    return this.detectedOpening;
  }

  addOpening(sequence, name) {
    this.openings[sequence] = name;
  }

  getAllOpenings() {
    return { ...this.openings };
  }

  getOpeningStats(opening) {
    if (!opening) return null;

    return {
      name: opening.name,
      moveCount: opening.moveCount,
      category: this.categorizeOpening(opening.name),
    };
  }

  categorizeOpening(openingName) {
    const name = openingName.toLowerCase();

    if (
      name.includes("king's pawn") ||
      name.includes("italian") ||
      name.includes("spanish") ||
      name.includes("scotch") ||
      name.includes("king's gambit")
    ) {
      return "King's Pawn Opening";
    } else if (name.includes("sicilian")) {
      return "Sicilian Defense";
    } else if (name.includes("french")) {
      return "French Defense";
    } else if (name.includes("caro-kann")) {
      return "Caro-Kann Defense";
    } else if (
      name.includes("queen's pawn") ||
      name.includes("queen's gambit")
    ) {
      return "Queen's Pawn Opening";
    } else if (name.includes("indian")) {
      return "Indian Defense";
    } else if (name.includes("english")) {
      return "English Opening";
    } else if (name.includes("réti") || name.includes("reti")) {
      return "Hypermodern Opening";
    } else {
      return "Other Opening";
    }
  }
}

export default OpeningDetector;

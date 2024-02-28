"use strict";
class Fraction {
    static EPSILON = 1e-10;
    static PRIME_LIST = [
        2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
        101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199,
        211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293,
        307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397,
        401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499,
        503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599,
        601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691,
        701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797,
        809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887,
        907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
    ];
    static PRIME_MAP = new Map([
        [6, [2, 3]],
        [10, [2, 5]],
        [24, [2, 2, 2, 3]],
        [48, [2, 2, 2, 2, 3]],
        [36, [2, 2, 3, 3]],
        [72, [2, 2, 2, 3, 3]],
        [31415926536, [2, 2, 2, 3, 3, 436332313]],
        [27182818285, [5, 7, 7523, 103237]],
        [14142135624, [2, 2, 2, 3, 1913, 308027]],
        [7071067812, [2, 2, 3, 1913, 308027]],
        [17320508076, [2, 2, 3, 211, 6840643]],
        [8660254038, [2, 3, 211, 6840643]],
        [5773502692, [2, 2, 211, 6840643]],
        [22360679775, [3, 3, 3, 3, 5, 5, 7, 199, 7927]],
        [11180339887, [317, 35269211]],
    ]);
    numerator;
    denominator;
    error;
    constructor(a, b) {
        let numerator;
        let denominator;
        let expected;
        if (a instanceof Fraction) {
            numerator = a.numerator;
            denominator = a.denominator;
            expected = a.numerator / a.denominator;
        }
        else if (typeof a == 'number' && typeof b == 'number') {
            numerator = a;
            denominator = b;
            expected = a / b;
        }
        else {
            expected = a;
            let done = false;
            for (let i = 2; i < 100; i++) {
                if (Fraction.isApproxInteger(a * i)) {
                    numerator = a * i;
                    denominator = i;
                    done = true;
                    break;
                }
            }
            if (!done) {
                for (let i = 100; i < 1e10; i *= 10) {
                    if (Fraction.isApproxInteger(a * i)) {
                        numerator = a * i;
                        denominator = i;
                        done = true;
                        break;
                    }
                }
            }
            numerator ??= a * 1e10;
            denominator ??= 1e10;
        }
        if (isNaN(numerator)) {
            throw new Error('NaN in numerator: ' + a + b);
        }
        if (isNaN(denominator)) {
            throw new Error('NaN in denominator: ' + a + b);
        }
        if (expected == 0) {
            denominator = 1;
            numerator = 0;
        }
        else if (expected == 1) {
            denominator = 1;
            numerator = 1;
        }
        const gcf = Fraction.gcf(Math.round(numerator), Math.round(denominator));
        this.numerator = Math.round(numerator / gcf);
        this.denominator = Math.round(denominator / gcf);
        this.error = expected - this.numerator / this.denominator;
    }
    static isApproxInteger(n) {
        return Math.abs(n - Math.round(n)) < Fraction.EPSILON;
    }
    static Zero() { return new Fraction(0, 1); }
    static isComposite(num) {
        if (num <= 0 || num == 1 || !Number.isInteger(num)) {
            return false;
        }
        return !Fraction.isPrime(num);
    }
    static isPrime(num) {
        if (num <= 0 || num == 1 || !Number.isInteger(num) || (num % 2 == 0 && num != 2) || (num % 3 == 0 && num != 3) || (num % 5 == 0 && num != 5)) {
            return false;
        }
        if (Fraction.PRIME_LIST.includes(num)) {
            Fraction.PRIME_MAP.set(num, [num]);
            return true;
        }
        if (num < Fraction.PRIME_LIST[Fraction.PRIME_LIST.length - 1]) {
            return false;
        }
        const factors = Fraction.PRIME_MAP.get(num);
        if (factors != undefined) {
            return factors.length == 1;
        }
        const SQRT = Math.sqrt(num);
        for (const prime of Fraction.PRIME_LIST) {
            if (prime > SQRT) {
                break;
            }
            if (Number.isInteger(num / prime)) {
                return false;
            }
        }
        for (let i = Fraction.PRIME_LIST[Fraction.PRIME_LIST.length - 1] + 2; i <= SQRT; i++) {
            if (Number.isInteger(num / i)) {
                return false;
            }
        }
        Fraction.PRIME_MAP.set(num, [num]);
        return true;
    }
    static factorize(num) {
        if (!Number.isInteger(num)) {
            return [];
        }
        if (num == 0 || num == 1 || Fraction.isPrime(num)) {
            return [num];
        }
        if (num < 0) {
            return [-1, ...Fraction.factorize(-num)];
        }
        if (Fraction.PRIME_MAP.has(num)) {
            return Fraction.PRIME_MAP.get(num).slice();
        }
        if (Fraction.PRIME_MAP.has(-num)) {
            let factors = Fraction.PRIME_MAP.get(-num).slice();
            if (num < 0) {
                factors = [-1, ...factors];
            }
            else {
                factors = factors.slice(1);
            }
            Fraction.PRIME_MAP.set(num, factors.slice());
            return factors;
        }
        let val = num;
        const factors = [];
        let tot = 1;
        for (let i = 2; i < Math.abs(num); i++) {
            if (Number.isInteger(val / i)) {
                val /= i;
                tot *= i;
                factors.push(i);
                i--;
            }
            if (!Fraction.PRIME_MAP.has(tot)) {
                Fraction.PRIME_MAP.set(tot, factors.slice());
            }
            if (Fraction.PRIME_MAP.has(val)) {
                factors.push(...this.PRIME_MAP.get(val));
                break;
            }
            if (val == 1) {
                break;
            }
            if (Fraction.isPrime(val)) {
                factors.push(val);
                break;
            }
        }
        factors.sort((a, b) => a - b);
        Fraction.PRIME_MAP.set(num, factors.slice());
        return factors;
    }
    static gcf(a, b) {
        if (!Number.isInteger(a) || !Number.isInteger(b) || a == 0 || b == 0) {
            return 1;
        }
        if (a == b || -a == b || a == -b) {
            return a > 0 ? a : b;
        }
        const factorsA = Fraction.factorize(a);
        const factorsB = Fraction.factorize(b);
        let gcf = 1;
        let lastIndex = 0;
        for (let i = 0; i < factorsA.length; i++) {
            for (let j = lastIndex; j < factorsB.length; j++) {
                if (factorsA[i] == factorsB[j] && factorsB[j] != 0) {
                    lastIndex = j + 1;
                    gcf *= factorsA[i];
                    factorsA[i] = 0;
                    factorsB[j] = 0;
                }
            }
        }
        return gcf;
    }
    static productList(vals) {
        return vals.reduce((a, b) => a * b, 1);
    }
    static vomit() { console.log(Fraction.PRIME_MAP); }
    add(other) {
        return this.addSub(new Fraction(other), 1);
    }
    sub(other) {
        return this.addSub(new Fraction(other), -1);
    }
    addSub(other, sign) {
        if (this.denominator == other.denominator) {
            return new Fraction(this.numerator + sign * other.numerator, this.denominator);
        }
        const quot1 = this.denominator / other.denominator;
        if (Number.isInteger(quot1)) {
            return new Fraction(this.numerator + sign * quot1 * other.numerator, this.denominator);
        }
        const quot2 = other.denominator / this.denominator;
        if (Number.isInteger(quot2)) {
            return new Fraction(sign * other.numerator + quot2 * this.numerator, other.denominator);
        }
        return new Fraction(this.numerator * other.denominator + sign * other.numerator * this.denominator, this.denominator * other.denominator);
    }
    mul(other) {
        if (typeof other == 'number') {
            other = new Fraction(other);
        }
        if (this.isZero() || other.isZero()) {
            return Fraction.Zero();
        }
        if (this.isOne()) {
            return other;
        }
        if (other.isOne()) {
            return this;
        }
        return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
    }
    div(other) {
        if (typeof other == 'number') {
            other = new Fraction(other);
        }
        if (other.isZero()) {
            throw new Error('Cannot divide by 0 at Fraction.div');
        }
        if (this.isZero() || other.isOne()) {
            return this;
        }
        if (this.isOne()) {
            return other.reciprocal();
        }
        return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator);
    }
    reciprocal() {
        if (this.numerator == 0) {
            throw new Error('Cannot divide by 0 at Fraction.reciprocal');
        }
        return new Fraction(this.denominator, this.numerator);
    }
    negated() {
        return new Fraction(-this.numerator, this.denominator);
    }
    toNumber() {
        return this.numerator / this.denominator;
    }
    toFixed(n) {
        if (this.isInteger()) {
            return this.numerator.toFixed(0).padStart(n + 2, ' ');
        }
        return (this.numerator + '/' + this.denominator).padStart(n + 2, ' ');
    }
    isOne() { return this.numerator == this.denominator; }
    isZero() { return this.numerator == 0; }
    isInteger() { return this.denominator == 1; }
    eq(other) {
        return this.numerator == other.numerator && this.denominator == other.denominator;
    }
}
class Matrix {
    static EPSILON = 1e-8;
    values;
    deter;
    constructor(values) {
        if (values.length == 0) {
            throw new Error('Cannot form empty matrix without rows');
        }
        const rowLength = values[0].length;
        if (rowLength == 0) {
            throw new Error('Cannot form empty matrix without columns');
        }
        for (let i = 1; i < values.length; i++) {
            if (values[i].length != rowLength) {
                throw new Error('Non-rectangular matrix');
            }
        }
        this.values = values;
        if (this.columnCount == 2 && this.rowCount == 2) {
            this.deter = this.values[0][0] * this.values[1][1] - this.values[0][1] * this.values[1][0];
        }
        else if (this.columnCount == 1 && this.rowCount == 1) {
            this.deter = this.values[0][0];
        }
    }
    clone() {
        const clonedValues = [];
        for (const row of this.values) {
            clonedValues.push(row.slice());
        }
        const clone = new Matrix(clonedValues);
        clone.deter = this.deter;
        return clone;
    }
    clean(epsilon = Matrix.EPSILON) {
        for (let r = 0; r < this.values.length; r++) {
            for (let c = 0; c < this.values[r].length; c++) {
                if (Math.abs(this.values[r][c] - Math.round(this.values[r][c])) < epsilon) {
                    this.values[r][c] = Math.round(this.values[r][c]);
                }
            }
        }
    }
    static dotProduct(a, b) {
        if (a.length != b.length || a.length == 0) {
            return 0;
        }
        return a.reduce((sum, a, i) => sum + a * b[i], 0);
    }
    static Identity(size) {
        const values = new Array(size).fill(null).map(e => new Array(size).fill(0));
        for (let i = 0; i < size; i++) {
            values[i][i] = 1;
        }
        return new Matrix(values);
    }
    static HorizontalVector(values) {
        return new Matrix([values.slice()]);
    }
    static VerticalVector(values) {
        const verticalValues = [];
        for (const val of values) {
            verticalValues.push([val]);
        }
        return new Matrix(verticalValues);
    }
    print(rowNames, colNames, places = 7) {
        const maxRowNameLength = Math.max.apply(null, rowNames?.map(e => e.length) ?? [0]);
        let s = '' + (colNames ? ''.padStart(maxRowNameLength + 3, ' ') : '') +
            (colNames?.map((e, i) => (i == colNames.length - 1 ? e + '\n' : e).padStart(places, ' ')).join(',') ?? '');
        for (let i = 0; i < this.values.length; i++) {
            s += i == 0 ? '[' : ' ';
            if (rowNames) {
                s += (rowNames[i] ?? '').padStart(maxRowNameLength, ' ') + ': ';
            }
            s += '[' + this.values[i].map(e => e.toFixed(3).padEnd(places)).join(',') + ']';
            s += i == this.values.length - 1 ? ']' : '\n';
        }
        console.log(s);
    }
    get rowCount() { return this.values.length; }
    get columnCount() { return this.values[0].length; }
    get isSquare() { return this.rowCount == this.columnCount; }
    sameDimensionAs(other) {
        return this.rowCount == other.rowCount && this.columnCount == other.columnCount;
    }
    get determinate() {
        if (!this.isSquare) {
            return null;
        }
        if (this.deter === undefined) {
            let rank = 1;
            let direction = 'col';
            let D = 0;
            if (this.rowCount > 3) {
                let mostZeroes = 0;
                for (let i = 0; i < this.rowCount; i++) {
                    const zeroesInRow = this.values[i].map(e => (e == 0 ? 1 : 0)).reduce((a, b) => a + b, 0);
                    const zeroesInColumn = this.getColumn(i).map(e => (e == 0 ? 1 : 0)).reduce((a, b) => a + b, 0);
                    if (zeroesInRow > mostZeroes) {
                        direction = 'row';
                        rank = i;
                        mostZeroes = zeroesInRow;
                    }
                    if (zeroesInColumn > mostZeroes) {
                        direction = 'col';
                        rank = i;
                        mostZeroes = zeroesInColumn;
                    }
                }
            }
            for (let i = 0; i < this.rowCount; i++) {
                const scalar = this.values[direction == 'row' ? rank : i][direction == 'row' ? i : rank];
                if (scalar == 0) {
                    continue;
                }
                const innerField = [];
                for (let j = 0; j < this.rowCount; j++) {
                    if (j == rank) {
                        continue;
                    }
                    const values = direction == 'row' ? this.getRow(j) : this.getColumn(j);
                    innerField.push([...values.slice(0, i), ...values.slice(i + 1)]);
                }
                const M = new Matrix(innerField);
                D += (i % 2 == 0 ? 1 : -1) * scalar * (direction == 'row' ? M : M.transposed).determinate;
            }
            this.deter = (rank % 2 == 0 ? 1 : -1) * D;
        }
        return this.deter;
    }
    get transposed() {
        const field = [];
        for (let c = 0; c < this.columnCount; c++) {
            field.push(this.getColumn(c));
        }
        return new Matrix(field);
    }
    get flatten() {
        const values = [];
        for (const row of this.values) {
            values.push(...row);
        }
        return values;
    }
    isValidRow(row) {
        return row >= 0 && row < this.rowCount && Number.isInteger(row);
    }
    isValidColumn(column) {
        return column >= 0 && column < this.columnCount && Number.isInteger(column);
    }
    isValidCell(row, col) {
        return this.isValidRow(row) && this.isValidColumn(col);
    }
    static fixIndex(index, max) {
        return index >= 0 ? index : max + index;
    }
    getRow(row) {
        return this.values[Matrix.fixIndex(row, this.rowCount)].slice();
    }
    getColumn(col) {
        return new Array(this.rowCount).fill(null).map((e, i) => this.values[i][Matrix.fixIndex(col, this.columnCount)]);
    }
    getRowSum(row) {
        return this.getRow(Matrix.fixIndex(row, this.rowCount)).reduce((a, b) => a + b, 0);
    }
    getColumnSum(col) {
        return this.getColumn(Matrix.fixIndex(col, this.columnCount)).reduce((a, b) => a + b, 0);
    }
    get(row, col) {
        return this.values[Matrix.fixIndex(row, this.rowCount)][Matrix.fixIndex(col, this.columnCount)];
    }
    setRow(row, values) {
        const newRow = Array.isArray(values) ? values : new Array(this.columnCount).fill(values);
        if (newRow.length != this.columnCount) {
            throw new Error(`Incorrect number of values in Matrix.setRow, expected ${this.columnCount} but got ${newRow.length}`);
        }
        if (!this.isValidRow(row)) {
            throw new Error(`Invalid row index of ${row} at Matrix.setRow`);
        }
        this.deter = undefined;
        this.values[row] = newRow;
    }
    setColumn(col, values) {
        const newRow = Array.isArray(values) ? values : new Array(this.rowCount).fill(values);
        if (newRow.length != this.rowCount) {
            throw new Error(`Incorrect number of values in Matrix.setColumn, expected ${this.rowCount} but got ${newRow.length}`);
        }
        if (!this.isValidColumn(col)) {
            throw new Error(`Invalid row index of ${col} at Matrix.setColumn`);
        }
        for (let i = 0; i < this.rowCount; i++) {
            this.values[i][col] = newRow[i];
        }
        this.deter = undefined;
    }
    getWithPrependedColumn(col) {
        if (col.length != this.rowCount) {
            throw new Error('Prepended column must have same number of rows as vector');
        }
        return new Matrix(this.values.map((e, i) => [...e, col[i]]));
    }
    getWithAppendedColumn(col) {
        if (col.length != this.rowCount) {
            throw new Error('Appended column must have same number of rows as vector');
        }
        return new Matrix(this.values.map((e, i) => [...e, col[i]]));
    }
    scaleRow(row, col, scalar) {
        if (!this.isValidCell(row, col)) {
            throw new Error(`No cell at (${row},${col})`);
        }
        if (isNaN(scalar)) {
            throw new Error('NaN scalar at Matrix.scaleRow');
        }
        if (scalar == 0) {
            console.warn('Multiplying entire row by 0 at Matrix.scaleRow');
        }
        this.values[row].forEach((e, i) => this.values[row][i] = e * scalar);
    }
    divideToOne(row, col) {
        this.scaleRow(row, col, 1 / this.values[row][col]);
    }
    zeroOut(activeRow, referenceRow, column) {
        if (!this.isValidColumn(column)) {
            throw new Error(`Invalid column ${column} at Matrix.zeroOut`);
        }
        if (this.get(activeRow, column) == 0) {
            return;
        }
        this.linearCombination(activeRow, referenceRow, -this.values[activeRow][column] / this.values[referenceRow][column]);
    }
    linearCombination(activeRow, referenceRow, scalar) {
        if (!this.isValidRow(activeRow)) {
            throw new Error(`Invalid active row ${activeRow} at Matrix.linearCombination`);
        }
        if (!this.isValidRow(referenceRow)) {
            throw new Error(`Invalid reference row ${referenceRow} at Matrix.linearCombination`);
        }
        this.values[activeRow].forEach((e, i) => {
            this.values[activeRow][i] = e + this.values[referenceRow][i] * scalar;
        });
    }
    multiply(other) {
        if (this.columnCount != other.rowCount) {
            return null;
        }
        const field = new Array(this.rowCount).fill(null).map(e => new Array(other.columnCount).fill(0));
        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < other.columnCount; c++) {
                field[r][c] = Matrix.dotProduct(this.getRow(r), other.getColumn(c));
            }
        }
        return new Matrix(field);
    }
    getInverse() {
        if (!this.isSquare) {
            return null;
        }
        const determinant = this.determinate;
        if (determinant == 0 || determinant == null) {
            return null;
        }
        if (this.rowCount == 1) {
            return new Matrix([[1 / this.values[0][0]]]);
        }
        if (this.rowCount == 2) {
            return new Matrix([
                [this.values[1][1] / determinant, -this.values[0][1] / determinant],
                [-this.values[1][0] / determinant, this.values[0][0] / determinant]
            ]);
        }
        const adjugate = this.getAdjugate();
        return new Matrix(adjugate.values.map(row => row.map(element => element / determinant)));
    }
    getMinor(row, col) {
        return new Matrix(this.values.filter((_, i) => i !== row).map(row => row.filter((_, j) => j !== col)));
    }
    getAdjugate() {
        const adjugate = [];
        for (let i = 0; i < this.values.length; i++) {
            adjugate[i] = [];
            for (let j = 0; j < this.values[i].length; j++) {
                const minor = this.getMinor(i, j);
                const cofactor = minor.determinate * ((i + j) % 2 === 0 ? 1 : -1);
                adjugate[i][j] = cofactor;
            }
        }
        return new Matrix(adjugate).transposed;
    }
}
class MatrixExact {
    static EPSILON = 1e-8;
    values;
    deter;
    constructor(values) {
        if (values.length == 0) {
            throw new Error('Cannot form empty matrix without rows');
        }
        const rowLength = values[0].length;
        if (rowLength == 0) {
            throw new Error('Cannot form empty matrix without columns');
        }
        for (let i = 1; i < values.length; i++) {
            if (values[i].length != rowLength) {
                throw new Error('Non-rectangular matrix');
            }
        }
        this.values = values.map(e => e.map(f => new Fraction(f)));
        if (this.columnCount == 2 && this.rowCount == 2) {
            this.deter = this.values[0][0].mul(this.values[1][1]).sub(this.values[0][1].mul(this.values[1][0]));
        }
        else if (this.columnCount == 1 && this.rowCount == 1) {
            this.deter = this.values[0][0];
        }
    }
    clone() {
        const clonedValues = [];
        for (const row of this.values) {
            clonedValues.push(row.slice());
        }
        const clone = new MatrixExact(clonedValues);
        clone.deter = this.deter;
        return clone;
    }
    clean(epsilon = MatrixExact.EPSILON) {
        for (const row of this.values) {
            for (const val of row) {
                if (!(val instanceof Fraction)) {
                    throw 'Non-Fraction';
                }
            }
        }
    }
    static dotProduct(a, b) {
        if (a.length != b.length || a.length == 0) {
            return 0;
        }
        return a.reduce((sum, a, i) => sum + a * b[i], 0);
    }
    static dotProductFraction(a, b) {
        let sum = new Fraction(0);
        if (a.length != b.length || a.length == 0) {
            return sum;
        }
        for (let i = 0; i < a.length; i++) {
            sum = sum.add(a[i].mul(b[i]));
        }
        return sum;
    }
    static Identity(size) {
        const values = new Array(size).fill(null).map(e => new Array(size).fill(0));
        for (let i = 0; i < size; i++) {
            values[i][i] = 1;
        }
        return new MatrixExact(values);
    }
    static HorizontalVector(values) {
        return new MatrixExact([values.slice()]);
    }
    static VerticalVector(values) {
        const verticalValues = [];
        for (const val of values) {
            verticalValues.push([val]);
        }
        return new MatrixExact(verticalValues);
    }
    print(rowNames, colNames, places = 7) {
        const maxRowNameLength = Math.max.apply(null, rowNames?.map(e => e.length) ?? [0]);
        let s = '' + (colNames ? ''.padStart(maxRowNameLength + 3, ' ') : '') +
            (colNames?.map((e, i) => (i == colNames.length - 1 ? e + '\n' : e).padStart(places, ' ')).join(',') ?? '');
        for (let i = 0; i < this.values.length; i++) {
            s += i == 0 ? '[' : ' ';
            if (rowNames) {
                s += (rowNames[i] ?? '').padStart(maxRowNameLength, ' ') + ': ';
            }
            s += '[' + this.values[i].map(e => e.toFixed(3).padEnd(places)).join(',') + ']';
            s += i == this.values.length - 1 ? ']' : '\n';
        }
        console.log(s);
    }
    get rowCount() { return this.values.length; }
    get columnCount() { return this.values[0].length; }
    get isSquare() { return this.rowCount == this.columnCount; }
    sameDimensionAs(other) {
        return this.rowCount == other.rowCount && this.columnCount == other.columnCount;
    }
    get determinateFraction() {
        if (!this.isSquare) {
            return null;
        }
        if (this.deter === undefined) {
            let rank = 1;
            let direction = 'col';
            let D = new Fraction(0);
            if (this.rowCount > 3) {
                let mostZeroes = 0;
                for (let i = 0; i < this.rowCount; i++) {
                    const zeroesInRow = this.values[i].map(e => (e.isZero() ? 1 : 0)).reduce((a, b) => a + b, 0);
                    const zeroesInColumn = this.getColumnFraction(i).map(e => (e.isZero() ? 1 : 0)).reduce((a, b) => a + b, 0);
                    if (zeroesInRow > mostZeroes) {
                        direction = 'row';
                        rank = i;
                        mostZeroes = zeroesInRow;
                    }
                    if (zeroesInColumn > mostZeroes) {
                        direction = 'col';
                        rank = i;
                        mostZeroes = zeroesInColumn;
                    }
                }
            }
            for (let i = 0; i < this.rowCount; i++) {
                const scalar = this.values[direction == 'row' ? rank : i][direction == 'row' ? i : rank];
                if (scalar.isZero()) {
                    continue;
                }
                const innerField = [];
                for (let j = 0; j < this.rowCount; j++) {
                    if (j == rank) {
                        continue;
                    }
                    const values = direction == 'row' ? this.getRow(j) : this.getColumn(j);
                    innerField.push([...values.slice(0, i), ...values.slice(i + 1)]);
                }
                const M = new MatrixExact(innerField);
                D = scalar.mul(i % 2 == 0 ? 1 : -1).mul((direction == 'row' ? M : M.transposed).determinate);
            }
            this.deter = D.mul(rank % 2 == 0 ? 1 : -1);
        }
        return this.deter;
    }
    get determinate() {
        return this.determinateFraction?.toNumber() ?? null;
    }
    get transposed() {
        const field = [];
        for (let c = 0; c < this.columnCount; c++) {
            field.push(this.getColumn(c));
        }
        return new MatrixExact(field);
    }
    get flatten() {
        const values = [];
        for (const row of this.values) {
            values.push(...row.map(e => e.toNumber()));
        }
        return values;
    }
    isValidRow(row) {
        return row >= 0 && row < this.rowCount && Number.isInteger(row);
    }
    isValidColumn(column) {
        return column >= 0 && column < this.columnCount && Number.isInteger(column);
    }
    isValidCell(row, col) {
        return this.isValidRow(row) && this.isValidColumn(col);
    }
    static fixIndex(index, max) {
        return index >= 0 ? index : max + index;
    }
    getRowFraction(row) {
        return this.values[MatrixExact.fixIndex(row, this.rowCount)].slice();
    }
    getColumnFraction(col) {
        return new Array(this.rowCount).fill(null).map((e, i) => this.values[i][MatrixExact.fixIndex(col, this.columnCount)]);
    }
    getRow(row) {
        return this.values[MatrixExact.fixIndex(row, this.rowCount)].slice().map(e => e.toNumber());
    }
    getColumn(col) {
        return new Array(this.rowCount).fill(null).map((e, i) => this.values[i][MatrixExact.fixIndex(col, this.columnCount)])
            .map(e => e.toNumber());
    }
    getRowSumFraction(row) {
        return this.getRowFraction(MatrixExact.fixIndex(row, this.rowCount)).reduce((a, b) => a.add(b), new Fraction(0));
    }
    getColumnSumFraction(col) {
        return this.getColumnFraction(MatrixExact.fixIndex(col, this.columnCount)).reduce((a, b) => a.add(b), new Fraction(0));
    }
    getRowSum(row) {
        return this.getRowSumFraction(row).toNumber();
    }
    getColumnSum(col) {
        return this.getColumnSumFraction(col).toNumber();
    }
    get(row, col) {
        return this.getFraction(row, col).toNumber();
    }
    getFraction(row, col) {
        return this.values[MatrixExact.fixIndex(row, this.rowCount)][MatrixExact.fixIndex(col, this.columnCount)];
    }
    setRow(row, values) {
        const newRow = Array.isArray(values) ? values.map(e => new Fraction(e)) : new Array(this.columnCount).fill(new Fraction(values));
        if (newRow.length != this.columnCount) {
            throw new Error(`Incorrect number of values in Matrix.setRow, expected ${this.columnCount} but got ${newRow.length}`);
        }
        if (!this.isValidRow(row)) {
            throw new Error(`Invalid row index of ${row} at Matrix.setRow`);
        }
        this.deter = undefined;
        this.values[row] = newRow;
    }
    setColumn(col, values) {
        const newRow = Array.isArray(values) ? values.map(e => new Fraction(e)) : new Array(this.rowCount).fill(new Fraction(values));
        if (newRow.length != this.rowCount) {
            throw new Error(`Incorrect number of values in Matrix.setColumn, expected ${this.rowCount} but got ${newRow.length}`);
        }
        if (!this.isValidColumn(col)) {
            throw new Error(`Invalid row index of ${col} at Matrix.setColumn`);
        }
        for (let i = 0; i < this.rowCount; i++) {
            this.values[i][col] = newRow[i];
        }
        this.deter = undefined;
    }
    getWithPrependedColumn(col) {
        if (col.length != this.rowCount) {
            throw new Error('Prepended column must have same number of rows as vector');
        }
        return new MatrixExact(this.values.map((e, i) => [...e, new Fraction(col[i])]));
    }
    getWithAppendedColumn(col) {
        if (col.length != this.rowCount) {
            throw new Error('Appended column must have same number of rows as vector');
        }
        return new MatrixExact(this.values.map((e, i) => [...e, new Fraction(col[i])]));
    }
    scaleRow(row, col, scalar) {
        if (!this.isValidCell(row, col)) {
            throw new Error(`No cell at (${row},${col})`);
        }
        if ((typeof scalar == 'number' && isNaN(scalar)) || (scalar instanceof Fraction && isNaN(scalar.toNumber()))) {
            throw new Error('NaN scalar at Matrix.scaleRow');
        }
        if (scalar == 0) {
            console.warn('Multiplying entire row by 0 at Matrix.scaleRow');
        }
        this.values[row].forEach((e, i) => this.values[row][i] = e.mul(scalar));
    }
    divideToOne(row, col) {
        this.scaleRow(row, col, new Fraction(1).div(this.values[row][col]));
    }
    zeroOut(activeRow, referenceRow, column) {
        if (!this.isValidColumn(column)) {
            throw new Error(`Invalid column ${column} at Matrix.zeroOut`);
        }
        if (this.getFraction(activeRow, column).isZero()) {
            return;
        }
        try {
            this.linearCombination(activeRow, referenceRow, this.values[activeRow][column].negated().div(this.values[referenceRow][column]));
        }
        catch (e) {
            console.log('active', activeRow, 'reference row', referenceRow, 'col', column);
            this.print();
            throw e;
        }
    }
    linearCombination(activeRow, referenceRow, scalar) {
        if (!this.isValidRow(activeRow)) {
            throw new Error(`Invalid active row ${activeRow} at Matrix.linearCombination`);
        }
        if (!this.isValidRow(referenceRow)) {
            throw new Error(`Invalid reference row ${referenceRow} at Matrix.linearCombination`);
        }
        this.values[activeRow].forEach((e, i) => {
            this.values[activeRow][i] = e.add(this.values[referenceRow][i].mul(scalar));
        });
    }
    multiply(other) {
        if (this.columnCount != other.rowCount) {
            return null;
        }
        const field = new Array(this.rowCount).fill(null).map(e => new Array(other.columnCount).fill(0));
        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < other.columnCount; c++) {
                field[r][c] = MatrixExact.dotProductFraction(this.getRowFraction(r), other.getColumnFraction(c));
            }
        }
        return new MatrixExact(field);
    }
    getInverse() {
        if (!this.isSquare) {
            return null;
        }
        const determinant = this.determinate;
        if (determinant == 0 || determinant == null) {
            return null;
        }
        if (this.rowCount == 1) {
            return new MatrixExact([[new Fraction(1).div(this.values[0][0])]]);
        }
        if (this.rowCount == 2) {
            return new MatrixExact([
                [this.values[1][1].div(determinant), this.values[0][1].negated().div(determinant)],
                [this.values[1][0].negated().div(determinant), this.values[0][0].div(determinant)]
            ]);
        }
        const adjugate = this.getAdjugate();
        return new MatrixExact(adjugate.values.map(row => row.map(element => element.div(determinant))));
    }
    getMinor(row, col) {
        return new MatrixExact(this.values.filter((_, i) => i !== row).map(row => row.filter((_, j) => j !== col)));
    }
    getAdjugate() {
        const adjugate = [];
        for (let i = 0; i < this.values.length; i++) {
            adjugate[i] = [];
            for (let j = 0; j < this.values[i].length; j++) {
                const minor = this.getMinor(i, j);
                const cofactor = minor.determinateFraction.mul(((i + j) % 2 === 0 ? 1 : -1));
                adjugate[i][j] = cofactor;
            }
        }
        return new MatrixExact(adjugate).transposed;
    }
}
class MatrixPrecise extends MatrixExact {
    static EPSILON = 1e-8;
}
var InfeasibleName;
(function (InfeasibleName) {
    InfeasibleName["XOR_Trivial"] = "An XOR expression cannot be satisfied";
    InfeasibleName["Resolve_IterMax"] = "The iteration limit was reached";
    InfeasibleName["Resolve_NonOptimal"] = "The result was non-optimal";
    InfeasibleName["Integer_NonFound"] = "No integer solution could be found";
    InfeasibleName["Infeasible"] = "This problem is infeasible";
    InfeasibleName["IfThen_NonParse"] = "An If-Then statement could not be parsed %s";
})(InfeasibleName || (InfeasibleName = {}));
class CompilationInfeasible extends CompilationMessage {
    constructor(name, reportWith, origin) {
        super(name, 'infeasible', undefined, reportWith, origin);
    }
}
var SimplexSolver;
(function (SimplexSolver) {
    const ARTIFICIAL = '\u{1D4D0}';
    SimplexSolver.INT_BOUND = '\u{1D4D1}';
    const EXCESS = '\u{1D4D4}';
    const PSEUDO = '\u{1D4DF}';
    SimplexSolver.CASTED = '\u{1D4E0}';
    const SURPLUS = '\u{1D4E2}';
    const ELIMINATED = '\u{1D4E7}';
    SimplexSolver.COND_BINARY = '\u{1D4E8}';
    const OPT_Z = '\u{1D4E9}';
    const ITERATION_MAX = 20;
    SimplexSolver.inequalityValues = ['>', '<', '<=', '>=', '='];
    SimplexSolver.operatorValues = ['|', '&', 'xor', 'nor'];
    let IterationResult;
    (function (IterationResult) {
        IterationResult[IterationResult["Intermediate"] = 0] = "Intermediate";
        IterationResult[IterationResult["Unbounded"] = 1] = "Unbounded";
        IterationResult[IterationResult["Optimal"] = 2] = "Optimal";
    })(IterationResult || (IterationResult = {}));
    function isInequality(val) {
        return SimplexSolver.inequalityValues.includes(val);
    }
    SimplexSolver.isInequality = isInequality;
    function isOperator(val) {
        return SimplexSolver.operatorValues.includes(val);
    }
    SimplexSolver.isOperator = isOperator;
    function getOppositeInequality(val) {
        if (val == '<') {
            return '>=';
        }
        if (val == '<=') {
            return '>';
        }
        if (val == '>') {
            return '<=';
        }
        if (val == '>=') {
            return '<';
        }
        return '=';
    }
    function isTrivial(bound, type) {
        if (type == 'binary') {
            return ((bound.cmp == '<' || bound.cmp == '<=') && bound.rhs >= 1) ||
                ((bound.cmp == '>' || bound.cmp == '>=') && bound.rhs <= 0);
        }
        else if (type == 'nonneg') {
            return (bound.cmp == '>' || bound.cmp == '>=') && bound.rhs <= 0;
        }
        else if (type == 'nonpos') {
            return (bound.cmp == '<' || bound.cmp == '<=') && bound.rhs >= 0;
        }
        return false;
    }
    function evalBool(bound) {
        if (bound.cmp == '=') {
            return bound.rhs == 1;
        }
        else if (bound.rhs >= 0 && ((bound.cmp == '<' && bound.rhs <= 1) || (bound.cmp == '<=' && bound.rhs < 1))) {
            return false;
        }
        else if (bound.rhs <= 1 && ((bound.cmp == '>' && bound.rhs >= 0) || (bound.cmp == '>=' && bound.rhs > 0))) {
            return true;
        }
    }
    function unique(list) {
        const uniqueList = [];
        for (const elem of list) {
            if (!uniqueList.includes(elem)) {
                uniqueList.push(elem);
            }
        }
        return uniqueList;
    }
    function getM(bound, other) {
        const A = ('a' in bound ? bound.a : bound.antecedent).lhs;
        const B = ('b' in bound ? bound.b : bound.consequent).lhs;
        const scalarDict = {};
        for (const name in A) {
            const val = Math.abs(A[name]);
            if (!(name in scalarDict) || val > scalarDict[name]) {
                scalarDict[name] = val;
            }
        }
        for (const name in B) {
            const val = Math.abs(B[name]);
            if (!(name in scalarDict) || val > scalarDict[name]) {
                scalarDict[name] = val;
            }
        }
        const maxValueDict = {};
        for (const std of other) {
            for (const name in std.lhs) {
                if (std.lhs[name] == 0) {
                    continue;
                }
                const V = Math.abs(std.rhs / std.lhs[name]);
                if (!(V in maxValueDict) || V > maxValueDict[name]) {
                    maxValueDict[name] = V;
                }
            }
        }
        let M;
        for (const name in scalarDict) {
            const m = scalarDict[name] * (maxValueDict[name] ?? 0);
            if ((M == undefined && m > 0) || (M != undefined && m > M)) {
                M = m;
            }
        }
        return M ?? 1e10;
    }
    function isStandardBound(bound) {
        return typeof bound == 'object' &&
            'lhs' in bound && typeof bound.lhs == 'object' &&
            'cmp' in bound && isInequality(bound.cmp) &&
            'rhs' in bound && typeof bound.rhs == 'number';
    }
    function isIfThenBound(bound) {
        return typeof bound == 'object' &&
            'antecedent' in bound && isStandardBound(bound.antecedent) &&
            'consequent' in bound && isStandardBound(bound.consequent);
    }
    function isIfAndOnlyIfBound(bound) {
        return typeof bound == 'object' &&
            'p' in bound && isStandardBound(bound.p) &&
            'q' in bound && isStandardBound(bound.q);
    }
    function isLogicalBound(bound) {
        return typeof bound == 'object' &&
            'a' in bound && isStandardBound(bound.a) &&
            'b' in bound && isStandardBound(bound.b) &&
            'operator' in bound && isOperator(bound.operator);
    }
    function isSingleBinary(bound, binary) {
        const names = Object.keys(bound.lhs);
        return names.length == 1 && binary.includes(names[0]);
    }
    function isApproxInteger(val) {
        return Math.abs(val - Math.round(val)) < Matrix.EPSILON;
    }
    function cleanStandardBound(bound, binary, integer, urs) {
        for (const ursName of urs ?? []) {
            if (ursName in bound.lhs) {
                if (binary?.includes(ursName)) {
                    continue;
                }
                bound.lhs[ursName + "'"] = bound.lhs[ursName];
                bound.lhs[ursName + '"'] = -bound.lhs[ursName];
                delete bound.lhs[ursName];
            }
        }
        if (bound.cmp == '=' || bound.cmp == '<=' || bound.cmp == '>=' || (binary == undefined && integer == undefined)) {
            return;
        }
        let allInteger = true;
        const intNames = [...(binary ?? []), ...(integer ?? [])];
        for (const name in bound.lhs) {
            if (!intNames.includes(name)) {
                allInteger = false;
                break;
            }
        }
        if (allInteger) {
            if (bound.cmp == '<') {
                bound.cmp = '<=';
                bound.rhs--;
            }
            if (bound.cmp == '>') {
                bound.cmp = '>=';
                bound.rhs++;
            }
        }
    }
    function parseIfThenAsStandard(bound, index, others, binary, integer) {
        const M = getM(bound, others);
        const ante = bound.antecedent;
        const cons = bound.consequent;
        const COND = SimplexSolver.COND_BINARY + index.toFixed();
        const antecedentNames = Object.keys(ante.lhs);
        const ANTE_SINGLE_BINARY = isSingleBinary(bound.antecedent, binary);
        if (ANTE_SINGLE_BINARY && cons.cmp == '=' && cons.rhs == 0) {
            if ((ante.cmp == '=' && ante.rhs == 0) || (ante.cmp == '>=' && ante.rhs > 0 && ante.rhs <= 1)) {
                const lhs = {};
                lhs[antecedentNames[0]] = 1;
                lhs[COND] = -M;
                return { boundList: [{ lhs: lhs, cmp: '<=', rhs: 0 }], binary: [COND] };
            }
            if ((ante.cmp == '=' && ante.rhs == 1) || (ante.cmp == '<=' && ante.rhs >= 0 && ante.rhs < 1)) {
                const lhs = {};
                lhs[antecedentNames[0]] = 1;
                lhs[COND] = M;
                return { boundList: [{ lhs: lhs, cmp: '<=', rhs: M }], binary: [COND] };
            }
        }
        if (ANTE_SINGLE_BINARY) {
            if (ante.cmp == '=' && ante.rhs == 0) {
                ante.cmp = '<';
                ante.rhs = 1;
            }
            if (ante.cmp == '=' && ante.rhs == 1) {
                ante.cmp = '>';
                ante.rhs = 0;
            }
        }
        if ((ante.cmp == '<' || ante.cmp == '>') && (cons.cmp == '<=' || cons.cmp == '>=')) {
            const ANTE_SIGN = ante.cmp == '>' ? 1 : -1;
            const CONS_SIGN = cons.cmp == '>=' ? 1 : -1;
            const fx = {};
            const gx = {};
            for (const name in ante.lhs) {
                fx[name] = ANTE_SIGN * ante.lhs[name];
            }
            for (const name in cons.lhs) {
                gx[name] = -CONS_SIGN * cons.lhs[name];
            }
            fx[COND] = M;
            gx[COND] = -M;
            return { boundList: [
                    { lhs: gx, cmp: '<=', rhs: -CONS_SIGN * cons.rhs },
                    { lhs: fx, cmp: '<=', rhs: M + ANTE_SIGN * ante.rhs }
                ], binary: [COND] };
        }
        return new CompilationInfeasible(InfeasibleName.IfThen_NonParse, stringifyBound(bound), 'parseIfThenAsStd catch');
    }
    function parseIfAndOnlyIfAsStandard(bound, index, others, binary, integer) {
        const aVal = parseIfThenAsStandard({ antecedent: bound.p, consequent: bound.q }, index, others, binary, integer);
        const bVal = parseIfThenAsStandard({ antecedent: bound.q, consequent: bound.p }, index + 1, others, binary, integer);
        if (aVal instanceof CompilationInfeasible) {
            return aVal;
        }
        if (bVal instanceof CompilationInfeasible) {
            return bVal;
        }
        return {
            boundList: [...aVal.boundList, ...bVal.boundList],
            binary: [...aVal.binary, ...bVal.binary]
        };
    }
    function parseLogicalAsStandard(bound, index, others, binary, integer) {
        if (bound.operator == '&') {
            return { boundList: [bound.a, bound.b], binary: [] };
        }
        else if (bound.operator == 'nor') {
            return { boundList: [
                    { ...bound.a, cmp: getOppositeInequality(bound.a.cmp) },
                    { ...bound.b, cmp: getOppositeInequality(bound.b.cmp) },
                ], binary: [] };
        }
        else if (bound.operator == '|') {
            const A_BINARY = isSingleBinary(bound.a, binary);
            const B_BINARY = isSingleBinary(bound.b, binary);
            if (A_BINARY && B_BINARY) {
                const A_VAL = evalBool(bound.a);
                const B_VAL = evalBool(bound.b);
                const lhs = {};
                lhs[Object.keys(bound.a)[0]] = 1;
                lhs[Object.keys(bound.b)[0]] = 1;
                const same = Object.keys(bound.a)[0] == Object.keys(bound.b)[0];
                if (A_VAL == undefined && B_VAL == undefined) {
                    return { boundList: [], binary: [] };
                }
                else if (same && A_VAL === B_VAL) {
                    return { boundList: [bound.a], binary: [] };
                }
                else if (same && A_VAL != undefined && B_VAL != undefined && A_VAL === !B_VAL) {
                    return { boundList: [], binary: [] };
                }
                else if (A_VAL === true && B_VAL === true) {
                    return { boundList: [{ lhs: lhs, cmp: '>=', rhs: 1 }], binary: [] };
                }
                else if (A_VAL === false && B_VAL === false) {
                    return { boundList: [{ lhs: lhs, cmp: '<=', rhs: 1 }], binary: [] };
                }
                else if (A_VAL === false && B_VAL === true) {
                    lhs[Object.keys(bound.b)[0]] = -1;
                    return { boundList: [{ lhs: lhs, cmp: '<=', rhs: 0 }], binary: [] };
                }
                else if (A_VAL === true && B_VAL === false) {
                    lhs[Object.keys(bound.a)[0]] = -1;
                    return { boundList: [{ lhs: lhs, cmp: '<=', rhs: 0 }], binary: [] };
                }
                else if (A_VAL === undefined) {
                    return { boundList: [bound.b], binary: [] };
                }
                else if (B_VAL === undefined) {
                    return { boundList: [bound.a], binary: [] };
                }
                console.error('FALL-THROUGH', A_VAL, B_VAL);
            }
            const M = getM(bound, others);
            const fx = structuredClone(bound.a.lhs);
            fx[SimplexSolver.COND_BINARY + index.toFixed()] = -M;
            const gx = structuredClone(bound.b.lhs);
            gx[SimplexSolver.COND_BINARY + index.toFixed()] = M;
            return { boundList: [
                    { ...bound.a, lhs: fx },
                    { lhs: gx, cmp: bound.b.cmp, rhs: M + bound.b.rhs }
                ], binary: [SimplexSolver.COND_BINARY + index.toFixed()] };
        }
        else if (bound.operator == 'xor') {
            const aNames = Object.keys(bound.a.lhs);
            const bNames = Object.keys(bound.b.lhs);
            const asBinary = aNames.length == 1 && bNames.length == 1 &&
                binary.includes(aNames[0]) && binary.includes(bNames[0]);
            if (asBinary) {
                const aTrivial = isTrivial(bound.a, 'binary');
                const bTrivial = isTrivial(bound.b, 'binary');
                if (aTrivial && bTrivial) {
                    return new CompilationInfeasible(InfeasibleName.XOR_Trivial, stringifyBound(bound), 'parseLogical dual trivial');
                }
                else if (aTrivial) {
                    return { boundList: [
                            {
                                lhs: bound.b.lhs,
                                cmp: getOppositeInequality(bound.b.cmp),
                                rhs: bound.b.rhs == 0.5 ? 0.5 : bound.b.rhs > 0.5 ? 0 : 1
                            }
                        ], binary: [] };
                }
                else if (bTrivial) {
                    return { boundList: [
                            {
                                lhs: bound.a.lhs,
                                cmp: getOppositeInequality(bound.a.cmp),
                                rhs: bound.a.rhs == 0.5 ? 0.5 : bound.a.rhs > 0.5 ? 0 : 1
                            }
                        ], binary: [] };
                }
                else if (evalBool(bound.a) === evalBool(bound.b)) {
                    const lhs = {};
                    lhs[aNames[0]] = 1;
                    lhs[bNames[0]] = 1;
                    return { boundList: [{ lhs: lhs, cmp: '=', rhs: 1 }], binary: [] };
                }
                else {
                    const lhs = {};
                    lhs[aNames[0]] = 1;
                    lhs[bNames[0]] = 1;
                    return parseLogicalAsStandard({
                        a: { lhs: lhs, cmp: '=', rhs: 0 },
                        b: { lhs: lhs, cmp: '=', rhs: 2 },
                        operator: '|'
                    }, index, others, binary, integer);
                }
            }
            else {
                return parseIfAndOnlyIfAsStandard({
                    p: bound.a,
                    q: { ...bound.b, cmp: getOppositeInequality(bound.b.cmp) }
                }, index, others, binary, integer);
            }
        }
        return { boundList: [], binary: [] };
    }
    function getStandardizedBounds(bounds, binary, integer, urs) {
        const cleanedBounds = bounds.filter(e => isStandardBound(e));
        const standardBounds = cleanedBounds.slice();
        const binaryNames = binary?.slice() ?? [];
        let index = 0;
        for (const bound of bounds) {
            if (isStandardBound(bound)) {
                cleanStandardBound(bound, binary, integer, urs);
                continue;
            }
            if (isIfAndOnlyIfBound(bound)) {
                cleanStandardBound(bound.p, binary, integer, urs);
                cleanStandardBound(bound.q, binary, integer, urs);
                const result = parseIfAndOnlyIfAsStandard(bound, index, standardBounds, binaryNames, integer);
                if (result instanceof CompilationInfeasible) {
                    return result;
                }
                cleanedBounds.push(...result.boundList);
                binaryNames.push(...result.binary);
            }
            else if (isIfThenBound(bound)) {
                cleanStandardBound(bound.antecedent, binary, integer, urs);
                cleanStandardBound(bound.consequent, binary, integer, urs);
                const result = parseIfThenAsStandard(bound, index, standardBounds, binaryNames, integer);
                if (result instanceof CompilationInfeasible) {
                    return result;
                }
                cleanedBounds.push(...result.boundList);
                binaryNames.push(...result.binary);
            }
            else if (isLogicalBound(bound)) {
                cleanStandardBound(bound.a, binary, integer, urs);
                cleanStandardBound(bound.b, binary, integer, urs);
                const result = parseLogicalAsStandard(bound, index, standardBounds, binaryNames, integer);
                if (result instanceof CompilationInfeasible) {
                    return result;
                }
                cleanedBounds.push(...result.boundList);
                binaryNames.push(...result.binary);
            }
            else {
                console.error('WTF BOUND');
            }
            index += 2;
        }
        return { bounds: cleanedBounds, binary: binaryNames };
    }
    function convertDictToLine(dict) {
        const cmp = [];
        for (const name in dict) {
            const coeff = dict[name];
            if (coeff == 0) {
                continue;
            }
            let parsedCoeff = coeff == 1 ? '' : coeff == -1 ? '-' : String(coeff);
            if (cmp.length > 0) {
                parsedCoeff = parsedCoeff.replace(/-/g, '- ');
            }
            cmp.push((coeff > 0 && cmp.length > 0 ? '+ ' : '') + parsedCoeff + name);
        }
        return cmp.join(' ');
    }
    function stringifyBound(bound) {
        if (isStandardBound(bound)) {
            return convertDictToLine(bound.lhs) + ' ' + bound.cmp + ' ' + bound.rhs;
        }
        else if (isLogicalBound(bound)) {
            return stringifyBound(bound.a) + ' ' + bound.operator + ' ' + stringifyBound(bound.b);
        }
        else if (isIfAndOnlyIfBound(bound)) {
            return stringifyBound(bound.p) + ' <=> ' + stringifyBound(bound.q);
        }
        else if (isIfThenBound(bound)) {
            return stringifyBound(bound.antecedent) + ' => ' + stringifyBound(bound.consequent);
        }
        return '';
    }
    function lindoize(problem, bounds) {
        const stdResult = getStandardizedBounds(bounds ?? problem.boundList, problem.binary, problem.integer, undefined);
        if (stdResult instanceof CompilationInfeasible) {
            return stdResult;
        }
        let file = problem.optimizer.slice(0, 3).toUpperCase() + ' ' + convertDictToLine(problem.objective) + '\nSUBJECT TO\n';
        for (const bound of stdResult.bounds) {
            file += convertDictToLine(bound.lhs) + ' ' + bound.cmp.charAt(0) + ' ' + bound.rhs + '\n';
        }
        file += 'END\n';
        for (const int of problem.integer ?? []) {
            if (!stdResult.binary.includes(int)) {
                file += 'GIN ' + int + '\n';
            }
        }
        for (const int of stdResult.binary) {
            file += 'INT ' + int + '\n';
        }
        for (const int of problem.urs ?? []) {
            file += 'FREE ' + int + '\n';
        }
        return file.slice(0, -1).replaceAll(SimplexSolver.COND_BINARY, '__y');
    }
    SimplexSolver.lindoize = lindoize;
    function solve(problem) {
        const stdResult = getStandardizedBounds(problem.boundList, problem.binary, problem.integer, problem.urs);
        if (stdResult instanceof CompilationInfeasible) {
            return stdResult;
        }
        const binaryNames = stdResult.binary;
        const cleanedBounds = stdResult.bounds;
        const variableNames = [];
        const basis = [OPT_Z];
        for (const term of [problem.objective, ...cleanedBounds.map(e => e.lhs)]) {
            for (const name in term) {
                if (!variableNames.includes(name)) {
                    variableNames.push(name);
                }
            }
        }
        for (let i = 0; i < cleanedBounds.length; i++) {
            const bound = cleanedBounds[i];
            if (bound.rhs < 0) {
                for (const name in bound.lhs) {
                    bound.lhs[name] *= -1;
                }
                bound.rhs *= -1;
                if (bound.cmp == '<') {
                    bound.cmp = '>';
                }
                else if (bound.cmp == '>') {
                    bound.cmp = '<';
                }
                else if (bound.cmp == '<=') {
                    bound.cmp = '>=';
                }
                else if (bound.cmp == '>=') {
                    bound.cmp = '<=';
                }
            }
            const name = bound.name ?? (i + 1).toFixed();
            const artificial = ARTIFICIAL + name;
            const excess = EXCESS + name;
            const surplus = SURPLUS + name;
            const pseudo = PSEUDO + name;
            if (bound.cmp == '=') {
                bound.lhs[pseudo] = -1;
                problem.objective[pseudo] = 0;
                variableNames.push(pseudo);
                bound.lhs[artificial] = 1;
                problem.objective[artificial] = 0;
                variableNames.push(artificial);
                basis.push(artificial);
            }
            else if (bound.cmp == '<' || bound.cmp == '<=') {
                bound.lhs[surplus] = 1;
                problem.objective[surplus] = 0;
                variableNames.push(surplus);
                basis.push(surplus);
            }
            else {
                bound.lhs[excess] = -1;
                problem.objective[excess] = 0;
                variableNames.push(excess);
                bound.lhs[artificial] = 1;
                problem.objective[artificial] = 0;
                variableNames.push(artificial);
                basis.push(artificial);
            }
        }
        variableNames.push(OPT_Z);
        let firstPhaseObjective;
        if (variableNames.some(e => e.includes(ARTIFICIAL))) {
            firstPhaseObjective = variableNames.map(e => e.includes(ARTIFICIAL) ? -1 : 0);
        }
        const secondPhaseObjective = variableNames.map(e => -(problem.objective[e] ?? 0));
        const matrixValues = [];
        for (const bound of cleanedBounds) {
            matrixValues.push([...variableNames.slice(0, -1).map(e => bound.lhs[e] ?? 0), bound.rhs]);
        }
        const relaxedSolution = resolve(matrixValues.map(e => e.slice()), firstPhaseObjective?.slice(), secondPhaseObjective.slice(), variableNames.slice(), basis.slice(), problem.optimizer, problem.objectiveOffset);
        const integerValues = unique([...(problem.integer ?? []), ...binaryNames]);
        console.log('RELAXED', relaxedSolution);
        if (relaxedSolution instanceof CompilationInfeasible || integerValues.length == 0) {
            return cleanExportValues(relaxedSolution);
        }
        let allIntegerObjective = true;
        for (const name in problem.objective) {
            if (!isApproxInteger(problem.objective[name])) {
                allIntegerObjective = false;
                break;
            }
        }
        let branchNameCounter = 0;
        function getBoundingConstraints(name, value) {
            if (isNaN(value)) {
                throw new Error('Bounding NaN');
            }
            const dict1 = {};
            dict1[name] = 1;
            dict1[SURPLUS + SimplexSolver.INT_BOUND + (branchNameCounter++).toFixed()] = 1;
            const dict2 = {};
            dict2[name] = 1;
            dict2[ARTIFICIAL + SimplexSolver.INT_BOUND + (branchNameCounter).toFixed()] = 1;
            dict2[EXCESS + SimplexSolver.INT_BOUND + (branchNameCounter++).toFixed()] = -1;
            return [
                { lhs: dict1, cmp: '<', rhs: Math.floor(value) },
                { lhs: dict2, cmp: '>', rhs: Math.ceil(value) }
            ];
        }
        function getBinaryConstraints(name) {
            const lhs0 = {};
            const lhs1 = {};
            lhs0[name] = 1;
            lhs1[name] = 1;
            lhs0[ARTIFICIAL + SimplexSolver.INT_BOUND + (branchNameCounter++).toFixed()] = 1;
            lhs1[ARTIFICIAL + SimplexSolver.INT_BOUND + (branchNameCounter++).toFixed()] = 1;
            return [
                { lhs: lhs0, cmp: '=', rhs: 0 },
                { lhs: lhs1, cmp: '=', rhs: 1 }
            ];
        }
        let bound1;
        let bound2;
        for (const name of integerValues) {
            const optimalValue = relaxedSolution.values[name];
            if (binaryNames.includes(name) && optimalValue != 0 && optimalValue != 1) {
                [bound1, bound2] = getBinaryConstraints(name);
                break;
            }
            if (!isApproxInteger(optimalValue)) {
                [bound1, bound2] = getBoundingConstraints(name, relaxedSolution.values[name]);
                break;
            }
        }
        if (bound1 == undefined || bound2 == undefined) {
            console.log('that\'s convenient!');
            return relaxedSolution;
        }
        const boundStack = [[bound1], [bound2]];
        let fullIntegerSolution;
        const SIGN = problem.optimizer == 'maximize' ? 1 : -1;
        let branchOshlop = 0;
        boundLoop: while (boundStack.length > 0 && branchOshlop++ < 5) {
            console.log('\n INT ROUND', branchOshlop, '\n');
            const poppedBounds = boundStack.pop();
            const addedVariableNames = [];
            const stackBasis = basis.slice();
            for (const bound of poppedBounds) {
                let basisName;
                for (const name in bound.lhs) {
                    if (name.includes(SimplexSolver.INT_BOUND)) {
                        basisName ??= name;
                        addedVariableNames.push(name);
                    }
                }
                if (basisName) {
                    stackBasis.push(basisName);
                }
            }
            const filler = new Array(addedVariableNames.length).fill(0);
            const stackVariableNames = [...variableNames.slice(0, -1), ...addedVariableNames, OPT_Z];
            const stackMatrixValues = [];
            for (const row of matrixValues) {
                stackMatrixValues.push([...row.slice(0, -1), ...filler, row.at(-1)]);
            }
            for (const bound of poppedBounds) {
                console.log('popped bound', bound);
                stackMatrixValues.push([...stackVariableNames.slice(0, -1).map(e => (bound.lhs[e] ?? 0)), bound.rhs]);
            }
            const stackFirstObjective = stackVariableNames.some(e => e.includes(ARTIFICIAL)) ?
                stackVariableNames.map(e => e.includes(ARTIFICIAL) ? -1 : 0) : undefined;
            const stackSecondObjective = stackVariableNames.map(e => -(problem.objective[e] ?? 0));
            const branchSolution = resolve(stackMatrixValues, stackFirstObjective, stackSecondObjective, stackVariableNames, stackBasis, problem.optimizer, problem.objectiveOffset);
            console.log('BRANCH', branchSolution);
            if (branchSolution instanceof CompilationInfeasible) {
                continue;
            }
            for (const name in branchSolution.values) {
                if (isNaN(branchSolution.values[name])) {
                    console.error('WTF NaN');
                    continue boundLoop;
                }
            }
            let nextNonInteger;
            let nextNonBinary;
            for (const intName of integerValues) {
                if (!isApproxInteger(branchSolution.values[intName])) {
                    nextNonInteger = intName;
                    break;
                }
            }
            for (const binName of binaryNames) {
                if (branchSolution.values[binName] != 0 && branchSolution.values[binName] != 1) {
                    nextNonBinary = binName;
                    break;
                }
            }
            if ((nextNonBinary || nextNonInteger) && fullIntegerSolution && branchSolution.objectiveValue * SIGN < fullIntegerSolution.objectiveValue * SIGN) {
                continue;
            }
            if (nextNonBinary) {
                const [nextBound1, nextBound2] = getBinaryConstraints(nextNonBinary);
                boundStack.push([...poppedBounds, nextBound1], [...poppedBounds, nextBound2]);
            }
            else if (nextNonInteger) {
                const [nextBound1, nextBound2] = getBoundingConstraints(nextNonInteger, branchSolution.values[nextNonInteger]);
                boundStack.push([...poppedBounds, nextBound1], [...poppedBounds, nextBound2]);
            }
            else {
                if (fullIntegerSolution == undefined) {
                    fullIntegerSolution = branchSolution;
                }
                else if (branchSolution.objectiveValue * SIGN > fullIntegerSolution.objectiveValue * SIGN) {
                    fullIntegerSolution = branchSolution;
                }
                if (problem.threshold && fullIntegerSolution.objectiveValue * SIGN > relaxedSolution.objectiveValue * SIGN * problem.threshold) {
                    break;
                }
                if (allIntegerObjective && branchSolution.objectiveValue == (problem.optimizer == 'maximize' ? Math.floor(relaxedSolution.objectiveValue) : Math.ceil(relaxedSolution.objectiveValue))) {
                    break;
                }
            }
        }
        return cleanExportValues(fullIntegerSolution ?? new CompilationInfeasible(InfeasibleName.Integer_NonFound, undefined, 'solve int fallback'));
    }
    SimplexSolver.solve = solve;
    function resolve(matrixValues, firstPhaseObjective, secondPhaseObjective, variableNames, basis, optimizer, offset) {
        if (firstPhaseObjective) {
            console.log('first phase');
            console.log('first phase', firstPhaseObjective, 'matrix val', matrixValues);
            const matrix = new MatrixExact([firstPhaseObjective, ...matrixValues]);
            console.log('\n -- INIT -- \n');
            matrix.print(basis, variableNames);
            for (let i = 1; i < basis.length; i++) {
                const name = basis[i];
                if (name.includes(ARTIFICIAL)) {
                    try {
                        matrix.zeroOut(0, i, variableNames.indexOf(name));
                    }
                    catch (e) {
                        console.log(variableNames, basis);
                        throw e;
                    }
                }
            }
            let firstStatus = IterationResult.Intermediate;
            const firstPassing = {
                optimizer: 'minimize',
                variableNames: variableNames,
                basis: basis,
                isDegenerate: false
            };
            let firstOshlop = 0;
            while (firstStatus == IterationResult.Intermediate && firstOshlop++ < ITERATION_MAX) {
                firstStatus = iterate(matrix, firstPassing);
            }
            if (firstOshlop == ITERATION_MAX) {
                console.log('1 cycled');
                return new CompilationInfeasible(InfeasibleName.Resolve_IterMax, undefined, 'resolve iter max 2');
            }
            if (firstStatus != IterationResult.Optimal) {
                console.log('first tableau not resolved');
                matrix.print();
                return new CompilationInfeasible(InfeasibleName.Resolve_NonOptimal, undefined, 'resolve non opt 2');
            }
            if (matrix.get(0, matrix.columnCount - 1) > Matrix.EPSILON) {
                console.log('case 1');
                return new CompilationInfeasible(InfeasibleName.Infeasible, undefined, 'case 1');
            }
            else if (!basis.some(e => e.includes(ARTIFICIAL))) {
                matrix.setRow(0, secondPhaseObjective);
                for (let i = 1; i < basis.length; i++) {
                    if (basis[i].includes(ARTIFICIAL)) {
                        matrix.setRow(i, 0);
                        basis[i] = ELIMINATED + basis[i];
                    }
                }
                console.log('x');
                matrix.print(basis, variableNames);
                for (let c = 0; c < variableNames.length - 1; c++) {
                    if (variableNames[c].includes(ARTIFICIAL)) {
                        variableNames[c] = ELIMINATED + variableNames[c];
                        matrix.setColumn(c, 0);
                    }
                }
                for (let r = 1; r < basis.length; r++) {
                    matrix.zeroOut(0, r, variableNames.indexOf(basis[r]));
                }
                console.log('case 2');
            }
            else {
                console.log('case 3');
                matrix.print(basis, variableNames);
                for (let c = 0; c < variableNames.length - 1; c++) {
                    const name = variableNames[c];
                    if (matrix.get(0, c) < 0) {
                        variableNames[c] = ELIMINATED + variableNames[c];
                        matrix.setColumn(c, 0);
                    }
                    else if (name.includes(ARTIFICIAL) && !basis.includes(name)) {
                        variableNames[c] = ELIMINATED + variableNames[c];
                        matrix.setColumn(c, 0);
                    }
                }
                matrix.setRow(0, secondPhaseObjective);
                for (let r = 1; r < basis.length; r++) {
                    matrix.zeroOut(0, r, variableNames.indexOf(basis[r]));
                }
                matrix.print(basis, variableNames);
            }
            console.log('second phase');
            let secondStatus = IterationResult.Intermediate;
            const secondPassing = {
                optimizer: optimizer,
                variableNames: variableNames,
                basis: basis,
                isDegenerate: false
            };
            let secondOshlop = 0;
            const nonInts2 = [];
            while (secondStatus == IterationResult.Intermediate && secondOshlop++ < ITERATION_MAX) {
                secondStatus = iterate(matrix, secondPassing);
            }
            if (secondOshlop == ITERATION_MAX) {
                console.log('2 cycled');
                return new CompilationInfeasible(InfeasibleName.Resolve_IterMax, undefined, 'resolve iter max 3');
            }
            if (secondStatus != IterationResult.Optimal) {
                return new CompilationInfeasible(InfeasibleName.Resolve_NonOptimal, undefined, 'resolve non opt 3');
            }
            return exportValues(matrix, variableNames, basis, offset);
        }
        else {
            console.log('second phase only');
            const matrix = new MatrixExact([secondPhaseObjective, ...matrixValues]);
            const nonInts = [];
            let status = IterationResult.Intermediate;
            const passing = {
                optimizer: optimizer,
                variableNames: variableNames,
                basis: basis,
                isDegenerate: false
            };
            let oshlop = 0;
            while (status == IterationResult.Intermediate && oshlop++ < ITERATION_MAX) {
                status = iterate(matrix, passing);
            }
            if (oshlop == ITERATION_MAX) {
                console.log('single cycled');
                return new CompilationInfeasible(InfeasibleName.Resolve_IterMax, undefined, 'resolve iter max');
            }
            if (status != IterationResult.Optimal) {
                return new CompilationInfeasible(InfeasibleName.Resolve_NonOptimal, undefined, 'resolve non opt');
            }
            return exportValues(matrix, variableNames, basis, offset);
        }
    }
    function iterate(matrix, data) {
        if (matrix.rowCount != data.basis.length) {
            throw new Error('Malformed basis');
        }
        const matrixArchive = matrix.clone();
        const firstRow = matrix.getRow(0).slice(0, -1);
        const sign = data.optimizer == 'maximize' ? 1 : -1;
        const archive = matrix.clone();
        data.isDegenerate = data.isDegenerate || matrix.getColumn(-1).slice(1).some(e => e == 0);
        let pivotColumnCandidates = [];
        let blandColumn;
        for (let i = 0; i < firstRow.length; i++) {
            if (data.variableNames[i].includes(PSEUDO) || data.variableNames[i].includes(ELIMINATED)) {
                continue;
            }
            if (pivotColumnCandidates.length == 0 && sign * firstRow[i] < 0) {
                pivotColumnCandidates = [i];
            }
            else if (pivotColumnCandidates.length > 0 && sign * firstRow[i] == sign * firstRow[pivotColumnCandidates[0]]) {
                pivotColumnCandidates.push(i);
            }
            else if (pivotColumnCandidates.length > 0 && sign * firstRow[i] < sign * firstRow[pivotColumnCandidates[0]]) {
                pivotColumnCandidates = [i];
            }
            if (blandColumn == undefined && sign * firstRow[i] < 0) {
                blandColumn = i;
            }
        }
        const pivotColumn = data.isDegenerate ? blandColumn :
            pivotColumnCandidates[Math.floor(Math.random() * pivotColumnCandidates.length)];
        if (pivotColumn == undefined) {
            return IterationResult.Optimal;
        }
        let pivotRowCandidates = [];
        let minimumRatio = Infinity;
        for (let r = 1; r < matrix.rowCount; r++) {
            if (matrix.get(r, pivotColumn) <= 0) {
                continue;
            }
            const ratio = matrix.get(r, matrix.columnCount - 1) / matrix.get(r, pivotColumn);
            if (ratio >= 0 && ratio < minimumRatio) {
                minimumRatio = ratio;
                pivotRowCandidates = [r];
            }
            else if (ratio >= 0 && ratio <= minimumRatio) {
                pivotRowCandidates.push(r);
            }
        }
        const pivotRow = data.isDegenerate ? pivotRowCandidates[0] :
            pivotRowCandidates[Math.floor(Math.random() * pivotRowCandidates.length)];
        if (pivotRow == undefined) {
            return IterationResult.Unbounded;
        }
        console.log('entering', data.variableNames[pivotColumn], 'leaving', data.basis[pivotRow]);
        matrix.divideToOne(pivotRow, pivotColumn);
        for (let r = 0; r < matrix.rowCount; r++) {
            if (r != pivotRow) {
                matrix.zeroOut(r, pivotRow, pivotColumn);
            }
        }
        for (let i = 1; i < matrix.rowCount; i++) {
            if (matrix.get(i, matrix.columnCount - 1) < 0) {
                console.log('\n--- WTF ---\n');
                archive.print();
                console.log(JSON.stringify(data.variableNames));
                console.log(JSON.stringify(data.basis));
                matrix.print();
                console.log('row', pivotRow, 'column', pivotColumn);
                throw 'WTF<0';
            }
        }
        data.basis[pivotRow] = data.variableNames[pivotColumn];
        matrix.print(data.basis, data.variableNames);
        if (data.basis.includes(SimplexSolver.COND_BINARY + 2) && !Number.isInteger(matrix.get(data.basis.indexOf(SimplexSolver.COND_BINARY + 2), -1))) {
            console.log('BEFORE');
            matrixArchive.print();
            console.log('AFTER');
            matrix.print();
            console.error('Non-Binary Value');
        }
        return IterationResult.Intermediate;
    }
    function exportValues(matrix, variableNames, basis, offset) {
        if (matrix.get(0, -1) == 77200) {
            console.log('\n OPTIMAL \n');
            matrix.print(basis, variableNames);
        }
        const dict = {
            objectiveValue: matrix.get(0, -1) + (offset ?? 0),
            values: {},
            reducedCost: {},
            dual: {},
            slacks: {}
        };
        for (let i = 0; i < variableNames.length - 1; i++) {
            const name = variableNames[i];
            if (name.includes(ARTIFICIAL) || name.includes(SimplexSolver.INT_BOUND)) {
                continue;
            }
            const slack = name.includes(SURPLUS) || name.includes(EXCESS) || name.includes(PSEUDO);
            const objective = matrix.get(0, i);
            const value = basis.includes(name) ? matrix.get(basis.indexOf(name), -1) : 0;
            let saveName = name.replaceAll(ELIMINATED, '');
            if (slack) {
                saveName = saveName.replace(SURPLUS, '').replace(EXCESS, '').replace(PSEUDO, '');
                dict.slacks[saveName] = value;
                dict.dual[saveName] = objective;
            }
            else {
                dict.values[saveName] = value;
                dict.reducedCost[saveName] = objective;
            }
        }
        return dict;
    }
    function cleanExportValues(values) {
        if (values == undefined || values instanceof CompilationInfeasible) {
            return values;
        }
        for (const name in values.values) {
            if (name.includes(SimplexSolver.COND_BINARY) || name.includes(SimplexSolver.CASTED)) {
                delete values.values[name];
                delete values.reducedCost[name];
            }
        }
        return values;
    }
    function exportValuesOld(matrix, variableNames, basis, offset) {
        function undoURS(dict) {
            for (const name in dict) {
                if (name.includes("'")) {
                    dict[name.replace("'", '')] = dict[name] - dict[name.replace("'", '"')];
                    delete dict[name];
                    delete dict[name.replace("'", '"')];
                }
            }
            return dict;
        }
        const objectiveValue = matrix.get(0, matrix.columnCount - 1) + (offset ?? 0);
        const values = {};
        const slacks = {};
        const reducedCost = {};
        const dual = {};
        for (let i = 0; i < variableNames.length - 1; i++) {
            const name = variableNames[i];
            if (name.includes(ARTIFICIAL) || name.includes(SimplexSolver.INT_BOUND)) {
                continue;
            }
            if (name.includes(ELIMINATED) && !name.includes(PSEUDO)) {
                values[name.replace(ELIMINATED, '')] = 0;
                reducedCost[name.replace(ELIMINATED, '')] = 0;
                continue;
            }
            let value = 0;
            if (basis.includes(name)) {
                value = matrix.get(basis.indexOf(name), matrix.columnCount - 1);
            }
            if (name.includes(EXCESS) || name.includes(SURPLUS) || name.includes(PSEUDO)) {
                slacks[name.replace(EXCESS, '').replace(SURPLUS, '').replace(PSEUDO, '').replace(ELIMINATED, '')] = value;
                dual[name.replace(EXCESS, '').replace(SURPLUS, '').replace(PSEUDO, '').replace(ELIMINATED, '')] = matrix.get(0, i);
            }
            else {
                values[name] = value;
                reducedCost[name] = matrix.get(0, i);
            }
        }
        return {
            objectiveValue: objectiveValue,
            values: undoURS(values),
            slacks: undoURS(slacks),
            reducedCost: undoURS(reducedCost),
            dual: undoURS(dual)
        };
    }
})(SimplexSolver || (SimplexSolver = {}));

interface IJStat {
  normal: {
    cdf: (x:number,mean:number,std:number) => number,
    inv: (p:number,mean:number,std:number) => number,
  },
  studentt: {
    cdf: (x:number,dof:number) => number,
    inv: (p:number,dof:number) => number,
  },
  chisquare: {
    cdf: (x:number,dof:number) => number,
    inv: (p:number,dof:number) => number,
  },
  ftest: (F: number,df1: number,df2: number) => number,
  anovafscore: (...x: number[][]) => number,
  anovaftest: (...x: number[][]) => number,
}
declare const jStat: IJStat;
interface IPapaResult {
  data: string[][];
  errors: any[];
  meta: {
    aborted: boolean;
    cursor: number;
    delimiter: string;
    linebreak: string;
    truncated: boolean;
  }
}
interface IPapaOptions {
  delimiter?: string;
  newline?: string;
  skipFirstNLines?: number;
  skipEmptyLines?: boolean | 'greedy';
  chunk: (result: IPapaResult,parser?: IPapa) => void;
}
interface IPapa {
  parse: (file: File,options: IPapaOptions) => void;
}
declare const Papa: IPapa;

// ~ INTERPRETATION ~

type DeArray<T extends any[]> = T extends (infer U)[] ? U : never;
type NestedArray<T> = T[] | NestedArray<T>[];
type FlexArray<T> = T[] | ReadonlyArray<T>;
type FlexRecord<K extends string|number,V> = Record<K,V> | Readonly<Record<K,V>>;
type ReadonlyMatrix<T> = ReadonlyArray<ReadonlyArray<T>>;
type Mutable<T> = { -readonly [P in keyof T]: T[P]; };

interface IStorableTypes {
  num: NumberValue;
  nvec: NumberVector;
  nmtx: NumberMatrix;

  var: Variable;
  vvec: VariableVector;
  vmtx: VariableMatrix;

  alias: Alias;
  avec: AliasVector;

  bool: BooleanValue;
  bvec: BooleanVector;

  str: StringValue;
  svec: StringVector;

  evec: EmptyVector;
  list: GenericVector<AbstractStorable[]>;

  any: AbstractStorable;
  none: NoneType;

  date: DateValue;
  dvec: DateVector;

  ntwk: Network;
  node: NetworkNode;
  edge: NetworkEdge;

  test: StatTestResult;

  meas: Measurement;
  mvec: MeasurementVector;

  offset: Offset;
  ovec: OffsetVector;

  frame: DataFrame;

  bound: BoundValue;
  model: LPModel;

  plot: Plot;
}
type StorableSymbolType = keyof IStorableTypes;
type SymbolType = StorableSymbolType | 'declaration' | 'keyword' | 'wtf' | 'macro' |
  'grouping' | 'operator' | 'proxy' | 'index' | 'name' | 'domain' | 'func';
type DisplaySymbolType = 'param' | 'equality' | 'number' | 'escaped';
type AliasValue = {coeff:NumberValue,val?:Variable}[];
type SymbolValue = number | string | Readonly<AliasValue> | AbstractStorable[] | boolean |
  string | Date | StatTestValue | IMeasurementValue | IOffsetValue | BoundDict | undefined;
type MessageLocation = AbstractSymbol | undefined | (AbstractSymbol|undefined)[];
type NonVector = Alias | Variable | NumberValue;
type MessagePosition = 'center' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right';

// ~ SUPER TYPES ~

abstract class SuperMath {
  public static readonly EPSILON = 1e-8;
  private static readonly factorialCache: number[] = [1,1];

  private constructor() {}

  public static sum(values: number[]): number {
    return values.reduce((a,b)=>a+b,0);
  }
  public static mean(values: number[]): number {
    return values.length==0 ? 0 : SuperMath.sum(values) / values.length;
  }
  public static median(values: number[]): number {
    if (values.length == 0) { return 0; }
    if (values.length == 1) { return values[0]; }
    if (values.length == 2) { return (values[0] + values[1]) / 2; }
    const sortedValues = values.toSorted((a,b) => a - b);
    if (sortedValues.length % 2 == 1) { //odd number of values
      return sortedValues[sortedValues.length / 2];
    }
    return (sortedValues[Math.floor(sortedValues.length/2)] + sortedValues[Math.ceil(sortedValues.length/2)] ) / 2;
  }
  public static mode(values: number[]): number {
    const arr = values.toSorted((a,b) => a - b); // Sort the array in ascending order

    let maxCount = 1;
    let currentCount = 1;
    let mode = arr[0];

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === arr[i - 1]) {
        currentCount++;
      } else {
        currentCount = 1;
      }
      if (currentCount > maxCount) {
        maxCount = currentCount;
        mode = arr[i];
      }
    }

    return mode;
  }
  
  public static sampleVariance(values: number[]): number {
    return SuperMath.variance(values,1);
  }
  public static populationVariance(values: number[]): number {
    return SuperMath.variance(values,0);
  }
  public static sampleStd(values: number[]): number {
    return Math.sqrt(SuperMath.variance(values,1));
  }
  public static populationStd(values: number[]): number {
    return Math.sqrt(SuperMath.variance(values,0));
  }
  private static variance(values: number[],minuend: number): number {
    if (values.length <= 1) { return 0; }
    const mean = SuperMath.mean(values);
    const squaredDifferences = values.map(e => Math.pow(e - mean,2));
    return squaredDifferences.reduce((sum, squaredDiff) => sum + squaredDiff,0) / (values.length - minuend);
  }

  public static factorial(n: number): number | Error {
    if (SuperMath.factorialCache[n] != undefined) {
      return SuperMath.factorialCache[n];
    }
    if (Number.isInteger(n) && n >= 0) {
      let iterValue = SuperMath.factorialCache[SuperMath.factorialCache.length - 1];
      for (let i = SuperMath.factorialCache.length; i <= n; i++) {
        iterValue *= i;
        SuperMath.factorialCache[i] = iterValue;
      }
      return iterValue;
    }
    if (Number.isInteger(n) && n < 0) {
      return new Error('Negative integer');
    }
    return SuperMath.gamma(n+1);
  }
  public static gamma(n: number): number {
    if (n === 0) {
      return Infinity;
    }
    if (n == 0.5) {
      return Math.sqrt(Math.PI);
    }
    if (n < 0.5) {
      return Math.PI / (Math.sin(Math.PI * n) * SuperMath.gamma(1 - n));
    }

    n -= 1;
    const g = 7;
    const p = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7,
    ];
    let result = p[0];
    for (let i = 1; i < g + 2; i++) {
      result += p[i] / (n + i);
    }
    const t = n + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, (n + 0.5)) * Math.exp(-t) * result;
  }

  public static getFactors(n: number): number[] {
    const factors: number[] = [];
    const Q = Math.sqrt(n);
    for (let i = Math.floor(Q); i > 0; i--) {
      if (Number.isInteger(n/i)) {
        factors.push(n/i);
        if (i != Q) {
          factors.unshift(i);
        }
      }
    }
    return factors;
  }
  public static getGridArrangement(n: number): {major:number,minor:number} {
    if (n < 0 || !Number.isInteger(n)) {
      return {major:0,minor:0};
    }
    const factors = SuperMath.getFactors(n);
    if (factors.length % 2 == 0) {
      return {
        minor: factors[factors.length / 2 - 1],
        major: factors[factors.length / 2]
      };
    } else { //perfect square
      return {
        minor: factors[ Math.floor(factors.length / 2) ],
        major: factors[ Math.floor(factors.length / 2) ]
      };
    }
  }

  public static leastSquaresRegression(xValues: number[],yValues: number[]): {slope:number;intercept:number,rSquared:number} {
    const xMean = SuperMath.mean(xValues);
    const yMean = SuperMath.mean(yValues);

    // Calculate slope (m) and intercept (b) using least squares formula
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < xValues.length; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean,2);
    }

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    const predicted = xValues.map(e => e * slope + intercept);
    const rSquared = SuperMath.calculateRSquared(predicted,yValues);

    return {slope,intercept,rSquared};
  }
  public static multivariateLeastSquaresRegression(xValues: Matrix,yValues: number[],includeIntercept: boolean): {slopes:number[];intercept:number,rSquared:number} | null {
    const baseX = includeIntercept?
      xValues.getWithAppendedColumn(new Array(xValues.rowCount).fill(1)):
      xValues;
    const X = baseX.transposed;
    
    const XTX = X.multiply(X.transposed);
    const XTY = X.multiply(new Matrix([yValues]).transposed);
    const invXTX = XTX?.getInverse();
    
    if (invXTX == null || XTY == null) {
      return null;
    }
    
    const beta = invXTX.multiply(XTY)?.getColumn(0);
    if (beta == null) {
      return null;
    }
    const predicted: number[] = [];
    for (let i = 0; i < xValues.rowCount; i++) {
      predicted.push( baseX.getRow(i).reduce((sum,e,i) => sum + e*beta[i],0) );
    }
    
    return {
      intercept: includeIntercept?beta[beta.length-1]:0,
      slopes: includeIntercept?beta.slice(0,-1):beta,
      rSquared: SuperMath.calculateRSquared(predicted,yValues)
    };
  }
  public static calculateRSquared(xValues: number[],yValues: number[]): number {
    // Check if the input lists have the same length
    if (xValues.length !== yValues.length) {
      console.error("SuperMath.calculateRSquared: Input lists must have the same length");
      return 0;
    }

    // Calculate the mean of x and y values
    const meanX = xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
    const meanY = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;

    // Calculate sum of squares of differences
    const ssr = xValues.reduce((sum, x, i) => sum + (x - meanX) * (yValues[i] - meanY), 0);
    const sseX = xValues.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
    const sseY = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);

    // Calculate R-squared
    return Math.pow(ssr / Math.sqrt(sseX * sseY),2);
  }

  public static renderNumber(n: number,l: number = 3,showEllipse: boolean = true): string {
    if (typeof n != 'number' || isNaN(n)) {
      console.error('Rendering NaN');
      console.trace();
      return 'NaN';
    }
    if (n == Infinity) {
      return '&#8734;';
    }
    if (n == -Infinity) {
      return '-&#8734;';
    }
    const isInteger = (n: number): boolean => Math.abs(Math.round(n) - n) < SuperMath.EPSILON;
    if (isInteger(n)) {
      return n.toFixed();
    }
    if (n == Math.PI) { //check if is pi
      return 'pi';
    }
    for (let d = 2; d <= 25; d++) { //check for fractional representations
      if (isInteger(d*n)) {
        return (d*n).toFixed() + '/' + d.toFixed();
      }
    }
    for (let i = 0; i <= l; i++) { //check if number can be shown in i decimal places
      const factor = 10 ** i;
      const roundedNumber = Math.round(n * factor) / factor;
      if (roundedNumber == n) {
        return n.toFixed(i);
      }
    }
    if (isInteger(n / Math.PI)) { //check if is multiple of pi
      return (n / Math.PI).toFixed() + 'pi';
    }
    return n.toFixed(l) + (showEllipse?'...':''); //show that more decimal exists
  }
  public static decimalFix(n: number,maxPrecision: number = 3): string {
    if (Math.abs(n - Math.round(n)) < SuperMath.EPSILON) {
      return n.toFixed(0);
    }
    const wholePart = n>0 ? Math.floor(n) : Math.ceil(n);
    const decimalPart = n>0 ? n-wholePart : Math.abs(n)+wholePart;
    let places = 1;
    while (places <= maxPrecision) {
      const scaled = decimalPart * 10 ** places;
      if (Math.abs(scaled - Math.round(scaled)) < SuperMath.EPSILON) {
        return wholePart.toFixed(0) + '.' + scaled.toFixed(0).padStart(places,'0');
      }
      places++;
    }
    return wholePart.toFixed(0) + '.' + decimalPart.toFixed(0).slice(2);
  }
  public static addCommas(number: number): string {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
  }
  public static ordinal(n: number): string {
    if (!Number.isInteger(n)) {
      return n + 'th';
    }
    const p = n>0?'':'-';
    const v = Math.abs(n);
    if (v % 10 == 1 && v % 100 != 11) {
      return p + v + 'st';
    }
    if (v % 10 == 2 && v % 100 != 12) {
      return p + v + 'nd';
    }
    if (v % 10 == 3 && v % 100 != 13) {
      return p + v + 'rd';
    }
    return p + v + 'th';
  }

  public static valuesUntil<T>(list: T[],fxn: (elem: T,index: number,array: T[]) => boolean,count: number = 1): number {
    if (count <= 0) {
      return 0;
    }
    let total = 0;
    for (let i = 0; i < list.length; i++) {
      if (fxn(list[i],i,list)) {
        total++;
      }
      if (total == count) {
        return i;
      }
    }
    return list.length;
  }
}
enum LevenshteinOperation {
  None,
  Insert,
  Delete,
  Substitute
}
interface ILevenshteinHighlighting {
  readonly common: boolean;
  readonly char: string;
}
abstract class SuperString {
  private static readonly hexTest: RegExp = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

  private constructor() {}

  public static levenshteinDistance(a: string,b: string): number {
    return SuperString.levenshteinMatrix(a,b)[a.length][b.length];
  }
  public static levenshteinMatrix(a: string,b: string): number[][] {
    const matrix = new Array(a.length+1);
  
    for (let r = 0; r < matrix.length; r++) {
      if (r == 0) {
        matrix[r] = new Array(b.length+1).fill(0).map((e,i) => i);
      } else {
        matrix[r] = new Array(b.length+1).fill(0);
        matrix[r][0] = r;
      }
    }
    for (let r = 1; r < matrix.length; r++) {
      for (let c = 1; c < matrix[r].length; c++) {
        matrix[r][c] = Math.min(
          matrix[r][c-1],
          matrix[r-1][c],
          matrix[r-1][c-1]
        ) + (a[r-1]==b[c-1]?0:1);
      }
    }
    return matrix;
  }
  public static levenshteinPath(a: string,b: string): LevenshteinOperation[];
  public static levenshteinPath(a: number[][],b: undefined): LevenshteinOperation[];
  public static levenshteinPath(a: string | number[][],b: string | undefined): LevenshteinOperation[] {
    if (a == b) {
      return [];
    }
    if (typeof a == 'string' && a.length == 0) {
      return new Array(b!.length).fill(LevenshteinOperation.Insert);
    }
    if (typeof b == 'string' && b.length == 0) {
      return new Array(a.length).fill(LevenshteinOperation.Delete);
    }
    const matrix = Array.isArray(a)?a:SuperString.levenshteinMatrix(a,b!);
    const path: LevenshteinOperation[] = [];
    let r = matrix.length - 1;
    let c = matrix[0].length - 1;
    let oshlop = 0;
    while (r >= 0 && c >= 0 && !(r == 0 && c == 0)) {
      const topLeft = (matrix[r-1] ?? [])[c-1] ?? Infinity;
      const up = (matrix[r-1] ?? [])[c] ?? Infinity;
      const left = matrix[r][c-1] ?? Infinity;
      const min = Math.min(topLeft,up,left);
      const sameValue = min == matrix[r][c];
      if (topLeft == min) {
        r--;
        c--;
        path.push(sameValue?LevenshteinOperation.None:LevenshteinOperation.Substitute);
      } else if (left == min) {
        c--;
        path.push(sameValue?LevenshteinOperation.None:LevenshteinOperation.Insert);
      } else {
        r--;
        path.push(sameValue?LevenshteinOperation.None:LevenshteinOperation.Delete);
      }
      if (oshlop++ == 1e3) {
        break;
      }
    }
    return path.reverse();
  }
  public static levenshteinHighlighting(a: string,b: string,matrix?: number[][]): ILevenshteinHighlighting[] {
    if (a == b) {
      return [{common:true,char:a}];
    }
    if (a.length == 0 || b.length == 0) {
      return [{common:false,char:b}];
    }
    const words: ILevenshteinHighlighting[] = [];
    const path = matrix?SuperString.levenshteinPath(matrix,undefined):SuperString.levenshteinPath(a,b);
    let copyA = a.slice();
    let copyB = b.slice();
    for (const operation of path) {
      if (operation == LevenshteinOperation.None || operation == LevenshteinOperation.Substitute) {
        words.push({common:operation==LevenshteinOperation.None,char:copyB.charAt(0)});
        copyA = copyA.slice(1);
        copyB = copyB.slice(1);
      } else if (operation == LevenshteinOperation.Delete) {
        copyA = copyA.slice(1);
      } else if (operation == LevenshteinOperation.Insert) {
        words.push({common:false,char:copyB.charAt(0)});
        copyB = copyB.slice(1);
      }
    }
    return words;
  }
  public static levenshteinCommon(s1: string,s2: string,n: number): number;
  public static levenshteinCommon(s1: number[][],s2: undefined,n: number): number;
  public static levenshteinCommon(s1: string | number[][],s2: string | undefined,n: number): number {
    if (typeof s1 == 'string' && typeof s2 == 'string') {
      if (s1.length == 0 || s2.length == 0 || (s1.length == 1 && s2.charAt(0) != s1[0]) || (s2.length == 1 && s1.charAt(0) != s2[0])) {
        return 0;
      }
    }
    const dp = Array.isArray(s1)?s1:SuperString.levenshteinMatrix(s1,s2!);
    let commonCount = 0;
  
    for (let i = 1; i < dp.length; i++) {
      for (let j = 1; j < dp[0].length; j++) {
        if (dp[i][j] <= n) {
          commonCount = Math.max(commonCount,i);
        }
      }
    }
  
    return commonCount;
  }
  public static levenshteinPathToDistance(path: LevenshteinOperation[]): number {
    return path.filter(e => e != LevenshteinOperation.None).length;
  }

  public static standardHexValue(hex: string): string | undefined {
    if (!SuperString.hexTest.test(hex)) {
      return undefined;
    }
    if (hex.length == 4) {
      return '#' + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) + hex.charAt(3) + hex.charAt(3);
    }
    if (hex.length == 5) {
      return '#' + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) + hex.charAt(3) + hex.charAt(3) + hex.charAt(4) + hex.charAt(4);
    }
    return hex;
  }
  public static getHexBrightness(hex: string): number {
    return (0.299 * parseInt(hex.substring(1,3),16) + 0.587 * parseInt(hex.substring(3,5),16) + 0.114 * parseInt(hex.substring(5,7),16)) / 255;
  }
}
abstract class SuperDate {
  private constructor() {}

  public static isLeapYear(year: number): boolean {
    return year % 400 == 0 || (year % 4 == 0 && year % 100 != 0);
  }
  public static getDaysInMonth(year: number,month: number): number {
    return [31,SuperDate.isLeapYear(year)?29:28,31,30,31,30,31,31,30,31,30,31][month];
  }

  public static getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Set the date to Thursday of the current week
  
    const year = d.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const weekNumber = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7); // 86400000 milliseconds in a day
    return weekNumber;
  }
  public static getISOYear(date: Date): number {
    const year = date.getFullYear();

    const startOfYearTimestamp = new Date(year,0,1).getTime();
    const dateTimestamp = date.getTime();
    const dayOfYear = Math.floor((dateTimestamp - startOfYearTimestamp) / (24 * 60 * 60 * 1000)) + 1;

    if (dayOfYear >= 1 && dayOfYear <= 3 && date.getDay() === 1) {
      return year - 1;
    }
    if (dayOfYear >= 52 && date.getDay() !== 0) {
      return year + 1;
    }
    return year;
  }
  public static daysLeftInMonth(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const currentDay = date.getDate();
    const daysInMonth = lastDayOfMonth.getDate();
  
    return daysInMonth - currentDay + 1;
  }
  public static daysLeftInYear(date: Date): number {
    const year = date.getFullYear();
    const nextYear = new Date(year + 1, 0, 1); // January 1st of the next year
    const daysRemaining = Math.floor((nextYear.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
    
    return daysRemaining + 1;
  }

  public static getWeeksInISOYear(year: number): number {
    const janFirst = new Date(year,0,1);
    return (janFirst.getDay() == 4 || (janFirst.getDay() == 3 && SuperDate.isLeapYear(year)))?53:52;
  }
  public static getDateFromISOYearWeekDay(year: number,week: number,dayOfWeek: number): Date | undefined {
    if (!Number.isInteger(year) || week < 1 || week > SuperDate.getWeeksInISOYear(year) || dayOfWeek < 1 || dayOfWeek > 7 || !Number.isInteger(week) || !Number.isInteger(dayOfWeek)) {
      return undefined;
    }
    const januaryFirst = new Date(year,0,1);
    const janFirstDOW = januaryFirst.getDay()==0?6:januaryFirst.getDay()-1;
    januaryFirst.setDate( januaryFirst.getDate() + (janFirstDOW<=3?-janFirstDOW:(7-janFirstDOW)) );
    januaryFirst.setDate( januaryFirst.getDate() + 7 * (week - 1) + dayOfWeek - 1 );
    return januaryFirst;
  }
}
interface IVector {
  x: number;
  y: number;
}
abstract class SuperVector {
  private static readonly EPSILON = 1e-6;

  private constructor() {}

  public static gridify(n: number): number[] {
    const s = Math.round(Math.sqrt(n));
    const arr = new Array(s).fill(s);
    const sign = s**2>n?-1:1;
    let counter = Math.abs(s**2 - n);
    for (let i = 0; i < arr.length && counter > 0; i += 2) {
      arr[i] += sign;
      counter--;
    }
    for (let i = 1; i < arr.length && counter > 0; i += 2) {
      arr[i] += sign;
      counter--;
    }
    return arr;
  }
  public static difference(a: IVector,b: IVector): IVector {
    const vec = {x:b.x-a.x,y:b.y-a.y};
    if (Math.abs(vec.x) < SuperVector.EPSILON) { vec.x = 0; }
    if (Math.abs(vec.y) < SuperVector.EPSILON) { vec.y = 0; }
    return vec;
  }
  public static magnitude(vec: IVector): number {
    return Math.sqrt(vec.x**2+vec.y**2);
  }
  public static distance(a: IVector,b: IVector): number {
    return SuperVector.magnitude(SuperVector.difference(a,b));
  }

}
class SuperRandom {
  public static randRange(a: number,b: number): number {
    const n = Math.min(a,b);
    const x = Math.max(a,b);
    return Math.random() * (x-n) + n;
  }
}
function keys<T extends string | number>(dict: FlexRecord<T,any> | Partial<FlexRecord<T,any>>): T[] {
  return Object.keys(dict) as T[];
}
function values<T extends string | number,V>(dict: Record<T,V> | Readonly<Record<T,V>>): V[] {
  return Object.values(dict) as V[];
}
function dictEqual<T extends string | number,V>(a: FlexRecord<T,V> | Partial<FlexRecord<T,V>>,b: FlexRecord<T,V> | Partial<FlexRecord<T,V>>,fallback?: V): boolean {
  for (const key of keys(a)) {
    if (a[key] != (b[key] ?? fallback)) {
      return false;
    }
  }
  for (const key of keys(b)) {
    if (b[key] != (a[key] ?? fallback)) {
      return false;
    }
  }
  return true;
}

// ~ MESSAGES ~

type MessageType = 'recommendation' | 'warning' | 'error' | 'infeasible';
abstract class CompilationMessage {
  public readonly type: MessageType;
  
  private readonly name: ErrorName | WarningName | RecommendationName | InfeasibleName;
  private readonly origin: string;
  private readonly reportWith: AbstractSymbol[] | string;

  protected constructor(name: ErrorName | WarningName | RecommendationName | InfeasibleName,type: MessageType,displayUnder: MessageLocation,reportWith: MessageLocation | string,origin: string) {
    this.name = name;
    this.type = type;
    this.origin = origin;
    if (typeof reportWith == 'string') {
      this.reportWith = reportWith;
    } else {
      this.reportWith = (Array.isArray(reportWith)?reportWith:[reportWith]).filter(e => e != undefined) as AbstractSymbol[];
    }
    const filteredUnder = (Array.isArray(displayUnder)?displayUnder:[displayUnder]).filter(e => e != undefined) as AbstractSymbol[];
    for (const sym of filteredUnder) {
      sym.addMarker(this.type);
    }
  }

  private static convert(val: AbstractSymbol): string {
    if (val == undefined || val == null) {
      return '@undefined';
    } else if (typeof val == 'string') {
      return '"' + val + '"';
    } else if (val.name) {
      return val.name;
    } else if (typeof val.value == 'string') {
      return '"' + val.value + '"';
    } else if (typeof val.value == 'number') {
      return val.value.toFixed(Number.isInteger(val.value)?0:3);
    }
    return '@anonymous';
  }
  public static countOccurrences(inputString: string,subString: string): number {
    const regex = new RegExp(subString,'g');
    const matches = inputString.match(regex);
    return matches ? matches.length : 0;
  }

  public toString(): string {
    const prefix = this.type.charAt(0).toUpperCase() + this.type.slice(1) + ': ';
    let parsedName = this.name.slice();

    const nameOccurrences = CompilationMessage.countOccurrences(parsedName,'%n');
    if (typeof this.reportWith == 'string' || this.reportWith.length == 0) { //nothing to put, replace w/ empty string
      parsedName = parsedName.replace(/\%n/g,'');
    } else if (nameOccurrences == 1) { //replace one occurrence with all values
      if (this.reportWith.length == 1) {
        parsedName = parsedName.replace(/\%n/g,CompilationMessage.convert(this.reportWith[0]));
      } else {
        parsedName = parsedName.replace(/\%n/g,this.reportWith.map(e => CompilationMessage.convert(e)).join(' '));
      }
    } else if (nameOccurrences > 0) {
      for (let i = 0; i < Math.max(nameOccurrences,this.reportWith.length); i++) {
        parsedName = parsedName.replace('%n',CompilationMessage.convert(this.reportWith[i]));
      }
    }

    const typeOccurrences = CompilationMessage.countOccurrences(parsedName,'%t');
    if (typeof this.reportWith == 'string' || this.reportWith.length == 0) { //nothing to put, replace w/ empty string
      parsedName = parsedName.replace(/\%t/g,'');
    } else if (typeOccurrences == 1) { //replace one occurrence with all values
      if (this.reportWith.length == 1) {
        parsedName = parsedName.replace(/\%t/g,'"' + this.reportWith[0].type + '"');
      } else {
        parsedName = parsedName.replace(/\%t/g,'"' + this.reportWith.map(e => e.type).join('" "') + '"');
      }
    } else if (typeOccurrences > 0) {
      for (let i = 0; i < Math.max(typeOccurrences,this.reportWith.length); i++) {
        parsedName = parsedName.replace('%t',i<this.reportWith.length?'"'+this.reportWith[i].type+'"':'');
      }
    }

    if (typeof this.reportWith == 'string' && parsedName.includes('%s')) {
      parsedName = parsedName.replace(/\%s/g,this.reportWith);
    } else {
      parsedName = parsedName.replace(/\%s/g,'');
    }

    return prefix + parsedName;
  }
  public print(): void {
    const color = this.type=='recommendation'?'green':(this.type=='warning'?'yellow':'red');
    console.log('%c' + this.toString() + ' @ ' + this.origin,'color:'+color);
  }
}
enum ErrorName {
  Blank = '%s',
  //generic
  IllegalExpression = 'This expression is in an illegal form %n',
  IllegalSymbol = 'This express contains illegal symbol %n',
  CircularDependency = 'This value depends on a value of itself %s',
  BeforeDefined = 'Value %s is being used before being assigned',
  IllegalMapOperation = 'This vector/matrix mapping results in undefined values',
  IllegalDomainValue = 'Values %n is out of the domain for this function',
  NonResolved = 'This expression could not be resolved to a single value',
  IllegalVariableDeclaration = 'There cannot be a variable declaration in this type of statement',
  IllegalSymbolName = '%n is an illegal symbol name',
  //measurement
  Measurement_UnknownUnit = 'Unit %n is not recognized',
  Measurement_NonParse = 'Unit could not be parsed',
  //functions
  Fxn_MissingRequiredParam = 'This function is missing the required parameter %s',
  Fxn_ResultNoPipe = 'There is no piped result',
  //macro
  Macro_MissingOpening = 'This macro is missing an opening parenthesis',
  Macro_MissingClosing = 'This macro is missing a closing parenthesis',
  //appendable
  Appendable_WrongType = 'Value of type %t cannot be appended to %t',
  Appendable_Frozen = 'This value is frozen and cannot have values appended to it',
  Appendable_MissingValue = 'This expression is missing a value to append',
  Appendable_NonResolving = 'The appending value could not be resolved',
  //stat test
  StatTest_InvalidAlpha = 'Value of %n is not inside valid range for alpha of [0,1]',
  StatTest_InvalidAlternative = 'Value of %n is not valid alternative',
  StatTest_UnequalPairedSize = 'The sample sizes must match for a paired test',
  StatTest_UnequalGOFSize = 'The distribution sizes must match',
  StatTest_SampleSizeZero = 'A test cannot have zero sample values',
  StatTest_ZeroSD = 'Standard deviation of sample is zero',
  StatTest_NonRect = 'Independence tests require rectangular matrices',
  StatTest_Mismatched = 'Independence tests require data of matching dimensions',
  StatTest_TooLittleData = 'There is no enough data to perform this test',
  StatTest_Unknown = 'An unknown error occurred during this test',
  //groupings
  MismatchedParentheses = 'The parentheses do not line up',
  MismatchedBrackets = 'The brackets do not match',
  MismatchedBraces = 'The braces do not match',
  ExcessiveBraces = 'Braces cannot be nested %n',
  MismatchedQuotes = 'Quotes must be paired',
  //bounds
  Bound_MultipleIs = 'There cannot be multiple "is" or "are" in a line',
  Bound_NonDomain = 'The right-hand side of a predicate must be a domain',
  Bound_MissingValue = 'There is no value here to bound',
  Bound_IllegalType = 'All bounded values by be coercible to an Alias or an Alias Vector',
  Bound_NoVariable = 'A bounded alias must contain a variable',
  Bound_ExtraValues = 'These values are not allowed in a domain expression',
  Bound_MismatchedSizes = 'These two Alias Vectors must be the same size',
  //declaration
  DuplicateDeclarations = 'Symbol %n has already been declared',
  EqualsSignExpected = 'An equals sign was expected %n',
  MismatchedDataTypes = 'RHS does not match data type declaration with value of type %t',
  VariableInitValue = 'Variable %n cannot be initialized to a value',
  //math
  Factorial_NegativeInteger = 'Cannot take factorial of a negative integer %n',
  Division_ByZero = 'Cannot divide by 0 %n',
  Modulo_ByZero = 'Cannot take modulo with 0 %n',
  //spread
  Spread_NonVector = 'Cannot spead non-vector type %t',
  Spread_SizeLimit = 'Cannot spread vectors longer than 10',
  Spread_Named = 'Spread parameters cannot be named',
  //vector
  Vector_InvalidStart = 'Vectors must start with "[", not %n',
  Vector_InvalidIndex = 'Value could not be determined at position %n',
  Vector_EvaluationError = 'Value cound not be determined for values %n',
  Vector_EmptyValue = 'Value is empty at position %n',
  Vector_IllegalValue = 'These values are not vectorable',
  Vector_NonStorableValues = 'Vectors cannot store these values',
  Vector_NameIndexCount = 'The wrong number of named indexes were provided',
  //empty vector
  EVector_CannotSlice = 'Empty vectors cannot be sliced',
  //composite variable declare
  VarBuild_NonConst = 'Variable names cannot be created with non-constant type %t',
  VarBuild_NonInteger = 'Variable names cannot be created with non-integer values %n',
  VarBuild_Negative = 'Variable names cannot be created with negative numbers %n',
  //size
  Size_VectorTypeMismatch = 'Cannot take size of non-vector %n',
  //vector slice
  Vector_SliceFlipIndexes = 'Start slice index %n cannot be greater than end slice index %n',
  Vector_SliceNonPositiveStep = '"Step" value must be greater than 0',
  Vector_SliceNonIntegerStep = '"Step" must be an integer',
  Vector_SliceIllegalType = 'This type cannot be used to slice a vector',
  //multiplication
  Mult_UnknownOperands = 'Operands of type %t and %t cannot be multiplied',
  Mult_VectorSize = 'Multiplied vectors must be of same size %n',
  Mult_NonRect = 'Non-Rectangular matrices cannot be used in matrix multiplication %n',
  Mult_InvalidDimensions = 'These matrices are the wrong dimensions to be multiplied',
  Mult_InvalidStringMultiplier = 'A string multiplier must be a positive integer',
  Dot_NonVector = 'The LHS of the dot operator must be a vector',
  Dot_NonIndex = 'This data type cannot be a named index',
  //unknown operands
  Add_UnknownOperands = 'Values of type %t and %t cannot be added',
  Sub_UnknownOperands = 'Values of type %t and %t cannot be subtracted',
  Division_UnknownOperands = 'Values of type %t and %t cannot be divided',
  Modulo_UnknownOperands = 'These values cannot be in modulo expression %n',
  Exponent_UnknownOperands = 'These values cannot be in exponent expression %n',
  Factorial_UnknownOperands = 'These values cannot be in factorial expression %n',
  //model
  Model_NoVariable = 'An optimizing Alias must contain non-constant values',
  Model_InvalidThreshold = 'The optimize threshold must be between 0 and 1',
  Model_InvalidOptimizer = 'Value of %n is not "max" or "min"',
  //for to,until
  For_NoIteratingSymbol = 'No iterating symbol is present in "for" statement',
  For_UnusedIteratingSymbol = 'This iterating symbol is not present in the expression %n',
  For_DuplicateIteratingSymbol = 'This iterating symbol defined twice %n',
  For_UnknownCommand = 'This value is not allowed in a "for" statement %n',
  For_NonVector = 'Cannot iterate over non-vector type %t',
  // For_DuplicateCommand = 'This value is provided twice in a "for" statement %n',
  For_CommandInvalidDataType = 'This type cannot be used for property %n',
  For_BothToAndUntil = 'The "to" and "until" keywords cannot both be present',
  For_NoStartPoint = 'No starting value for the vector builder was given',
  For_NoEndPoint = 'No "to" or "until" value for the vector builder was given',
  For_StepIsZero = 'The "step" value cannot be 0',
  For_InvalidStep = 'This value of "step" results in a non-terminating vector',
  For_SameStartAndStop = 'This starting value and ending value cannot be the same',
  For_ResultingSizeZero = 'These values lead to 0 computed values',
  //indexes
  Index_NonConstantString = 'Vector indexes cannot be of type %t',
  Index_NonSingularValue = 'Vector indexes could not be evaluated',
  Index_ColumnNonMatrix = 'Cannot get column of non-matrix type %t',
  NIndex_NonInteger = 'Indexes must be integers %n',
  NIndex_NonPositive = 'Indexes must be positive %n',
  NIndex_OutOfBounds = 'Index is out of bounds %n',
  SIndex_Invalid = 'Index %n does not exist on this vector',
  SIndex_NoneFound = 'This vector does not have named indexes',
  SIndex_Column = 'Named indexes do not exist for columns',
  SIndex_NonString = 'Named indexes cannot have non-string type %t',
  SIndex_KeyNonVector = 'Non-vectors do not have named indexes',
  FIndex_NonBoolean = 'Filtering condition not able to be resovled to single boolean',
  Findex_FilteredSizeZero = 'Filtering results in 0 matching values',
  //normalizer
  Norm_NonConstantVector = 'Cannot normalizer non-cvec type %t',
  Norm_VectorSizeZero = 'Cannot normalize vector with size 0',
  Norm_ZeroMagnitude = 'Vector of magnitude zero cannot be converted to unit vector',
  Norm_ZeroSD = 'Cannot standardize vector with standard deviation of 0',
  Norm_NegInProb = 'Cannot make probability distribution of a vector with negative values',
  //objective
  MissingObjectiveFunction = 'These is no objective function',
  UnresolvedError = 'There are unresolved errors in the QUINNDO program',
  //except and include
  MismatchedIncludeType = 'This value cannot be included in this vector',
  MismatchedExceptType = 'This value cannot be excepted in this vector',
  //union and intersect
  Union_NonVector = 'Union requires two vector operands',
  Union_VectorMismatch = 'Union requires two vectors of the same type',
  Intersect_NonVector = 'Intersect requires two vector operands',
  Intersect_VectorMismatch = 'Intersect requires two vectors of the same type',
  Unique_NonVector = 'Unique requires a vector operand',
  //lsr
  LSR_VectorZeroSize = 'A least squares regression requires two vectors with a size greater than zero',
  LSR_VectorSizeMismatch = 'A least squares regression requires two vectors of the game size',
  LSR_NonRectangularMatrix = 'A multivariate least squares regression requires a rectangular matrix',
  LSR_VariableCountMismatch = 'A multivariate least squares regression requires one output for each input',
  LSR_NoColumnsInMatrix = 'The input matrix has no columns',
  LSR_PossibleCollinearity = 'The regression failed - possible collinearity',
  LSR_TooManyVariables = 'There are more variable than data points',
  //rsq
  RSQ_VectorZeroSize = 'An r-squared calculation requires two vectors with a size greater than zero',
  RSQ_VectorSizeMismatch = 'An r-squared calculation requires two vectors of the game size',
  RSQ_VectorTypeMismatch = 'A r-squared calculation requires two constant vectors',
  //rsq
  Each_VectorZeroSize = 'A pointwise calculation requires two vectors with a size greater than zero',
  Each_VectorSizeMismatch = 'A pointwise calculation requires two vectors of the same size',
  Each_VectorTypeMismatch = 'A pointwise calculation requires two constant vectors or matrices',
  Each_MatrixDimensionMismatch = 'A pointwise calculation requires two matrices of the same dimensions',
  //transpose
  Transpose_NonMatrixType = 'Cannot transpose non matrix-type %t',
  Transpose_MalFormedMatrix = 'This matrix is not in a transposable form',
  //trace,determinate
  Trace_NonConstantMatrix = 'Trace does not exist on non-constant matrix type %t',
  Trace_NonSquare = 'Trace does not exist on a non-square matrix',
  Deter_NonConstantMatrix = 'Trace does not exist on non-constant matrix type %t',
  Deter_NonSquare = 'Trace does not exist on a non-square matrix',
  NCol_NonRect = 'Cannot get number of column for a non-rectangular matrix',
  //string casting
  StringCast_VectorSizeZero = 'A string of size 0 cannot be vectorized',
  Join_NonStringVector = 'A value of type %t cannot be joined into a string',
  Char_NonString = 'A value of type %t cannot be split into a StringVector',
  //binary operators
  Not_NonBoolean = 'Cannot take opposite of non-boolean type %t',
  AndOr_NonBoolean = 'Cannot perform boolean operation of non-boolean type %t',
  Comparison_SingleEqualsSign = 'This is the assignment and constraint equality operator - try "=="',
  Comparison_MissingLeftOperand = 'The %s operator is missing its left operand',
  Comparison_MissingRightOperand = 'The %s operator is missing its right operand',
  Comparison_InvalidTypes = 'Values of type %t and %t cannot be compared with an inequality',
  //summarizer
  Summarizer_MissingVector = 'Missing required parameter "v"',
  Summarizer_NonConstantVector = 'Cannot summarize non-constant vector type %t',
  Summarizer_SizeZero = 'Cannot summarize vector of size 0',
  //log
  BasicOperation_NonNumerical = 'Cannot take this value of non-numerical type %t',
  //functions
  Function_TooManyParams = '%n parameters were passed, but up to %n is/are allowed',
  Function_MissingParameter = 'This function is missing required parameter %s',
  Function_UnresolvableParam = 'This parameter could not be resolved to a single value',
  Function_NoPipedResult = 'This function call does not have a piped value to reference with "result"',
  //range
  Range_NonConstant = 'Cannot make range with non-constant type %t',
  Range_ZeroEnd = '"end" parameter cannot be 0 if it is the only provided parameter',
  Range_MissingEnd = 'Missing required parameter "end"',
  Range_Infinity = 'Infinity is not a valid parameter value',
  //is/are
  IsAre_NonDeclaration = 'Cannot check data type with non-type %n',
  //sort
  Sorting_WrongVector = 'Expected value of type %t is not a constant vector or string vector',
  Sorting_WrongReverse = 'Value of reverse is of type %t when a boolean was expected',
  //ifelse
  IfElse_MissingColon = 'Each "?" must have a matching ":" character',
  IfElse_NonBoolean = 'Condition is of non-boolean type %t',
  IfElse_CondNonResolved = 'The condition could not be resolved to a single value',
  IfElse_ValueNonResolved = 'The value could not be resolved to a single value',
  IfElse_MissingTrueValue = 'This ternary operator is missing a value if true',
  IfElse_MissingFalseValue = 'This ternary operator is missing a value if false',
  IfElse_NonResolved = 'The unused value in this statement does not resolve to a single value',
  //assertion
  Assertion_MissingValue = 'There is no value to fulfill the assertion',
  Assertion_NonResolvable = 'This assertion could not be resolved to a single value',
  Assertion_NonBoolean = 'This assertion return non-boolean type %t',
  Assertion_Failed = 'This assertion failed',
  //fafo
  FAFO_UnequalNumber = 'The number of "fa" statements must equal the number of "fo" statements',
  FAFO_OutOfOrder = 'Each "fo" must be preceded with a matching "fa" statement',
  FAFO_NoTestValue = 'This fafo statement has no test value',
  FAFO_NoFallbackValue = 'This fafo statement has no fallback value',
  FAFO_NoFallbackResolution = 'This "fo" statement could not be resolved to a single value',
  //in
  In_InvalidOperands = 'Cannot check for value of type %t in value of type %t',
  //identity
  Identity_NegativeDimensions = 'The number of dimensions cannot be nonpositive',
  Identity_NonInteger = 'The number of dimensions must be an integer',
  //inverse
  Inverse_NonSquare = 'Non-square matrices have no inverse',
  Inverse_SizeZero = 'No matrix exists for a matrix of size zero',
  Inverse_NonInvertible = 'This matrix is not invertible',
  //date
  Date_NoYear = 'The month cannot be specified without a year',
  Date_NoMonth = 'The day cannot be specified without a month',
  Date_NoHour = 'The minute cannot be specified without an hour',
  Date_NoMinute = 'The second cannot be specified without a minute',
  Date_IllegalValue = 'This is not a legal value for value %s',
  //node
  Node_NonIntegerName = 'Numerical node names must be integers',
  //erdos
  Erdos_InvalidProbability = 'Edge probability must be between 0 and 1',
  Erdos_InvalidNodeCount = 'Node count must be a positive integer',
  //matrix constructor
  MatrixCon_CouldNotBeConstructed = 'This matrix could not be constructed',
  //offset constructor
  Offset_NonIntegerOffset = 'The offset data type cannot take non-integer offsets',
  //frame
  Frame_ColDimMismatch = 'The size of each row in a data frame must match the number of columns',
  //import
  Import_MissingSingleName = 'An import statement must be followed by a single name',
  Import_NonImported = 'There is no imported value with name %n',
  //plot
  Scatter_MismatchedSizes = 'The length of x and y are different',
}
class CompilationError extends CompilationMessage {
  public constructor(name: ErrorName,displayUnder: MessageLocation,reportWith: MessageLocation | string,origin: string) {
    super(name,'error',displayUnder,reportWith,origin);
  }
}
enum WarningName {
  Module_AmbiguousOperands = 'Exactly one argument of modulo is negative %n',
  Exponent_AmbiguousOperands = 'Consider adding clarifying parentheses to exponent expression %n',
  Constant_AllConstraints = 'There is a constraint that is entirely constants %n',
  
  Append_MissingAppendingValue = 'There is not value to append in a slot on this line',

  PartialIndexNames = 'Some indexes are unnamed',
  OneVectorWithNamedIndexes = 'Only one array being multiplied has named indexes',
  MismatchedNamesIndexes = 'These named indexes do not line up, defaulting to order presented',

  NonParsableName = 'Constrant name(s) could not be parsed, all constraints on this line are unnamed',
  UnequalNameCount = 'The number of constraints and contraint names are unequal, all contraints on this line are unnamed',
  DuplicateConstraintName = 'This constraint name is already in use, all constraints on this line are unnamed',

  BothExceptAndInclude = 'This value is both excepted and included, excepted takes precedence',

  Transpose_NonRectangularMatrix = 'The original matrix was not rectanglar before being transposed',

  Comparison_DifferingTypes = 'This comparison may be unintentional - a comparison between types %t and %t will always return as being unequal',

  Function_DuplicateParameter = 'The parameter %s was passed more than once - later values will be ignored',

  SIndex_Duplicate = 'There cannot be multiple indexes with the same name - all named indexes will be ignored',
  SIndex_DNE = 'This vector has no named indexes to check',

  Erdos_NodeLimit = 'The number of nodes in this graph as benn limited to 100',

  MatrixCon_NonRect = 'The constructed vector is not rectangular',
}
class CompilationWarning extends CompilationMessage {
  public constructor(name: WarningName,displayUnder: MessageLocation,reportWith: MessageLocation | string,origin: string) {
    super(name,'warning',displayUnder,reportWith,origin);
  }
}
enum RecommendationName {
  CloneIdenticalVector = 'This vector is being cloned unchanged, consider removing vector constructor',
  Import_AlreadyImported = 'This value is already imported on an earlier line'
}
class CompilationRecommendation extends CompilationMessage {
  public constructor(name: RecommendationName,displayUnder: MessageLocation,reportWith: MessageLocation | string,origin: string) {
    super(name,'recommendation',displayUnder,reportWith,origin);
  }
}

// ~ RESOLVEABLES ~

enum MessageLevel {
  None,
  Recommendation,
  Warning,
  Error
}
abstract class ResolvingSymbol<V extends SymbolValue> {
  public readonly index: number;
  public readonly line: CodeLine;
  public readonly name: undefined | string;
  public readonly type: SymbolType;
  public readonly value: V;
  public readonly text: string;

  public displayAsIndex: boolean = false;
  public displayAsParam: boolean = false;
  public displayAsOperator: boolean = false;
  public displayAsProxy: boolean = false;
  public displayAsFunction: boolean = false;
  public displayAsKeyword: boolean = false;

  public suppressError: boolean = false;
  public overridePreview?: string;

  protected readonly consumedList: AbstractSymbol[];
  protected readonly hasMessage: Partial<Record<MessageType,true>> = {};

  public constructor(index: number,line: CodeLine,value: V,text: string,type: SymbolType,name?: string,consumed?: AbstractSymbol[]) {
    this.index = index;
    this.line = line;
    this.value = value;
    this.consumedList = consumed ?? [];
    this.text = text;
    this.name = name;
    this.type = type;
    let currentIndex = -1;
    for (const food of this.consumedList) {
      if (food.index == -1) {
        continue;
      }
      if (food.index <= currentIndex) {
        console.log(this.value,this.name,this.type,'!!!',consumed?.map(e => e.toString()));
        throw new Error('Invalid order of consumption');
      }
      currentIndex = food.index;
    }
  }
  public toString() {
    if (this.name != undefined) {
      return `[${this.type}:${this.value}@${this.name}]`;
    }
    if (this.value == '[' || this.value == ']') {
      return `{${this.type}:${this.value}}`;
    }
    if (typeof this.value == 'number') {
      return `[${this.type}:${SuperMath.renderNumber(this.value,3)}]`;
    }
    return `[${this.type}:${this.value}]`;
  }

  public consumeStart(other: AbstractSymbol): void {
    if (other == this) {
      throw new Error('Cannabalism');
    }
    if (other.index == -1 || this.consumedList.length == 0 || this.consumedList[0].index == -1 || other.index < this.consumedList[0].index) {
      this.consumedList.unshift(other);
      for (const name in this.hasMessage) {
        if (this.hasMessage[name as MessageType]) {
          other.addMarker(name as MessageType);
        }
      }
    } else {
      throw new Error('Food is out of order');
    }
  }
  public consumeEnd(other: AbstractSymbol): void {
    if (other == this) {
      throw new Error('Cannabalism');
    }
    if (other.index == -1 || this.consumedList.length == 0 || this.consumedList[this.consumedList.length-1].index == -1 || other.index > this.consumedList[this.consumedList.length-1].index) {
      this.consumedList.unshift(other);
      for (const name in this.hasMessage) {
        if (this.hasMessage[name as MessageType]) {
          other.addMarker(name as MessageType);
        }
      }
    } else {
      throw new Error('Food is out of order');
    }
  }
  public addMarker(marker: MessageType): void {
    this.hasMessage[marker] = true;
    for (const food of this.consumedList) {
      food.addMarker(marker);
    }
  }

  public delete(): void {}
  public abstract clone(index: number,text?: string,line?: CodeLine): ResolvingSymbol<V>;

  public castableTo(type: StorableSymbolType) { return false; }
  public castTo<T extends keyof IStorableTypes>(type: T): IStorableTypes[T] {
    throw new Error(`Cannot cast symbol of type ${this.type} to type of ${type}`);
  }

  get markers(): (MessageType|SymbolType|DisplaySymbolType)[] {
    if (this.displayAsOperator) {
      return ['operator'];
    }
    if (this.displayAsIndex) {
      return ['index'];
    }
    if (this.displayAsParam) {
      return ['param'];
    }
    if (this.displayAsFunction) {
      return ['func'];
    }
    if (this.displayAsKeyword) {
      return ['keyword'];
    }
    return [this.type];
  }
  
  get consumedSymbols(): AbstractSymbol[] { return this.consumedList; }
  get messageLevel(): MessageLevel {
    if (this.hasMessage.error && !this.suppressError) {
      return MessageLevel.Error;
    } else if (this.hasMessage.warning) {
      return MessageLevel.Warning;
    } else if (this.hasMessage.recommendation) {
      return MessageLevel.Recommendation;
    }
    return MessageLevel.None;
  }
}
type AbstractSymbol = ResolvingSymbol<SymbolValue>;
abstract class StorableSymbol<V extends SymbolValue> extends ResolvingSymbol<V> {
  public displayAsAny: boolean = false;

  public abstract rename(index: number,name: string,line: CodeLine): StorableSymbol<V>;
  public abstract equals(other: AbstractSymbol,withReference?: boolean,strict?: boolean): boolean;
  abstract get preview(): string;

  public toJSON(): object {
    return {
      name: this.name,
      value: this.value,
      text: this.text,
      type: this.type
    };
  }

  public castableTo(symbolType: SymbolType): boolean {
    if (symbolType == 'any') {
      return true;
    }
    return this.type == symbolType;
  }
  public castTo<T extends keyof IStorableTypes>(symbolType: T): IStorableTypes[T] {
    if (symbolType == this.type || symbolType == 'any') {
      return this as unknown as IStorableTypes[T];
    }
    throw new Error(`Symbol with type ${this.type} and value ${this.value} could not be case to type ${symbolType}`);
  }

  get markers(): (SymbolType|MessageType|DisplaySymbolType)[] {
    if (this.displayAsAny) {
      return ['any'];
    }
    return super.markers;
  }
}
type AbstractStorable = StorableSymbol<SymbolValue>;

// ~ BASE STOREABLES ~

interface IComparable<V extends AbstractStorable> {
  compare(other: V,type: '>'|'>='|'<'|'<='): boolean;
}
class NumberValue extends StorableSymbol<number> implements IComparable<NumberValue> {
  public constructor(index: number,line: CodeLine,value: number,text: string,name?: string,consumed?: AbstractSymbol[]) {
    super(index,line,value,text,'num',name,consumed);
  }

  get flippedValue(): number { return -this.value; }
  get preview(): string { return SuperMath.renderNumber(this.value,5); }
  get opposite() { return new NumberValue(-1,this.line,-this.value,''); }
  get markers(): (SymbolType|DisplaySymbolType|MessageType)[] {
    if (this.name == undefined) {
      return ['number'];
    }
    return super.markers;
  }
  get isInteger(): boolean { return Number.isInteger(this.value); }

  public castableTo(symbolType: SymbolType): boolean {
    if (symbolType == 'alias') {
      return true;
    }
    return super.castableTo(symbolType);
  }
  public castTo<T extends keyof IStorableTypes>(symbolType: T): IStorableTypes[T] {
    if (symbolType == 'alias') {
      return new Alias(-1,this.line,[
        {coeff:this}
      ],'',undefined,[this]) as IStorableTypes[T];
    }
    return super.castTo(symbolType);
  }

  public clone(index: number,text?: string,line?: CodeLine): NumberValue {
    return new NumberValue(index,line ?? this.line,this.value,text ?? this.text,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): NumberValue {
    return new NumberValue(index,line,this.value,name,name);
  }
  public equals(other: AbstractSymbol,withReference?: boolean,strict?: boolean): boolean {
    if (!(other instanceof NumberValue)) { return false; }
    if (withReference && this.name != other.name) { return false; }
    if (strict) { return this.value == other.value; }
    return Math.abs(this.value - other.value) < SuperMath.EPSILON;
  }
  public compare(other: NumberValue,type: '>'|'>='|'<'|'<='): boolean {
    if (type == '<') {
      return this.value < other.value;
    } else if (type == '<=') {
      return this.value <= other.value;
    } else if (type == '>') {
      return this.value > other.value;
    } else if (type == '>=') {
      return this.value >= other.value;
    }
    return false;
  }
  public map(fxn: ((e:number) => number) | ((e:number,i:number) => number)): NumberValue | CompilationError {
    const result = fxn(this.value,0);
    if (isNaN(result) || result == undefined) {
      return new CompilationError(ErrorName.IllegalDomainValue,this,this,'Constant.Map');
    }
    return new NumberValue(-1,this.line,result,'');
  }
}
class Variable extends StorableSymbol<undefined> {
  private readonly fallbacks: (CodeLine|VariableVector)[];

  public constructor(index: number,origin: CodeLine | VariableVector,name: string) {
    super(index,(origin instanceof CodeLine)?origin:origin.line,undefined,name,'var',name);
    this.fallbacks = [origin];
  }
  public clone(index: number,text?: string,line?: CodeLine): Variable {
    return new Variable(index,line ?? this.line,text ?? this.name!);
  }

  public equals(other: AbstractSymbol): boolean {
    if (!(other instanceof Variable)) { return false; }
    return this.name == other.name;
  }

  public castableTo(symbolType: SymbolType): boolean {
    if (symbolType == 'alias') {
      return true;
    }
    return super.castableTo(symbolType);
  }
  public castTo<T extends keyof IStorableTypes>(symbolType: T): IStorableTypes[T] {
    if (symbolType == 'alias') {
      return new Alias(-1,this.line,[
        {coeff:new NumberValue(-1,this.line,1,''),val:this}
      ],'',undefined,[this]) as IStorableTypes[T];
    }
    return super.castTo(symbolType);
  }

  get preview(): string { return this.name!; }

  public rename(index: number,name: string,line: CodeLine): Variable {
    const v = new Variable(index,line,name);
    for (const fs of this.fallbacks) {
      v.fallbacks.push(fs);
    }
    return v;
  }

  public addFallback(line: CodeLine | VariableVector): void {
    if (this.fallbacks.indexOf(line) == -1) {
      this.fallbacks.push(line);
    }
  }
  public removeFallback(line: CodeLine | VariableVector): void {
    if (this.fallbacks.indexOf(line) != -1) {
      this.fallbacks.splice(this.fallbacks.indexOf(line),1);
    }
  }
  get isDefined(): boolean { return this.fallbacks.length > 0; }
}
class Alias extends StorableSymbol<AliasValue> {
  public constructor(index: number,line: CodeLine,value: AliasValue,text: string,name?: string,consumed?: AbstractSymbol[]) {
    super(index,line,value,text,'alias',name,consumed);
  }

  public toString(): string {
    return `[alias:${this.preview}@${this.name ?? 'anonymous'}]`;  
  }
  public clone(index: number,text?: string,line?: CodeLine): Alias {
    return new Alias(index,line ?? this.line,this.value,text ?? this.text,this.name);
  }

  get preview(): string {
    let s = '';
    for (let i = 0; i < this.value.length; i++) {
      if (this.value[i].coeff.value >= 0 && i != 0) {
        s += '+';
      }
      s += this.value[i].coeff.preview;
      if (this.value[i].val) {
        s += this.value[i].val!.preview;
      }
    }
    return s;
  }
  get opposite(): Alias {
    const oppositeValue: AliasValue = [];
    for (const v of this.value) {
      oppositeValue.push({val:v.val,coeff:v.coeff.opposite});
    }
    return new Alias(-1,this.line,oppositeValue,'');
  }
  
  public scale(C: NumberValue): Alias {
    const values: AliasValue = [];
    for (const v of this.value) {
      values.push({
        coeff: new NumberValue(-1,this.line,v.coeff.value * C.value,''),
        val: v.val
      });
    }
    return new Alias(-1,this.line,values,'');
  }
  public getParsed(flip: boolean = false): {dict:Record<string,number>,offset:number} {
    const sign = flip?-1:1;
    const dict: Record<string,number> = {};
    let offset = 0;
    for (const pair of this.value) {
      if (pair.val) {
        dict[pair.val.name!] = (dict[pair.val.name!] ?? 0) + sign * pair.coeff.value;
      } else {
        offset -= sign * pair.coeff.value;
      }
    }
    return {dict,offset};
  }
  get hasVariable(): boolean {
    for (const set of this.value) {
      if (set.val) {
        return true;
      }
    }
    return false;
  }

  public rename(index: number,name: string,line: CodeLine): Alias {
    return new Alias(index,line,this.value,name,name);
  }
  public equals(other: AbstractSymbol,withReference?: boolean): boolean {
    if (withReference && other.name != this.name) {
      return false;
    }
    if (!(other instanceof StorableSymbol) || !other.castableTo('alias')) {
      return false;
    }
    const otherAsAlias = other.castTo('alias');
    let thisConstantValue = 0;
    let otherConstantValue = 0;
    const thisVariableValue: Record<string,number> = {};
    const otherVariableValue: Record<string,number> = {};
    for (const dict of this.value) {
      if (dict.val == undefined) {
        thisConstantValue += dict.coeff.value;
      } else {
        thisVariableValue[dict.val.name!] = (thisVariableValue[dict.val.name!] ?? 0) + dict.coeff.value;
      }
    }
    for (const dict of otherAsAlias.value) {
      if (dict.val == undefined) {
        otherConstantValue += dict.coeff.value;
      } else {
        otherVariableValue[dict.val.name!] = (otherVariableValue[dict.val.name!] ?? 0) + dict.coeff.value;
      }
    }
    if (thisConstantValue != otherConstantValue) {
      return false;
    }
    for (const key in thisVariableValue) {
      if (!(key in otherVariableValue)) {
        return false;
      }
      if (thisVariableValue[key] != otherVariableValue[key]) {
        return false;
      }
    }
    for (const key in otherVariableValue) {
      if (!(key in thisVariableValue)) {
        return false;
      }
      if (thisVariableValue[key] != otherVariableValue[key]) {
        return false;
      }
    }
    return true;
  }
}

// ~ OTHER PRIMITIVES ~

class WhatTheFuck extends StorableSymbol<undefined> {
  public constructor(index: number,line: CodeLine,text: string,name: string,consumed?: AbstractSymbol[]) {
    super(index,line,undefined,text,'wtf',name,consumed);
  }

  public clone(index: number,text?: string,line?: CodeLine): WhatTheFuck {
    return new WhatTheFuck(index,line ?? this.line,text ?? this.text,this.name!);
  }
  public rename(index: number,name: string,line: CodeLine): WhatTheFuck {
    return new WhatTheFuck(index,line,this.text,name);
  }
  get preview(): string { return 'WTF'; }

  public equals(other: AbstractSymbol): boolean {
    return other instanceof WhatTheFuck;    
  }
}
class BooleanValue extends StorableSymbol<boolean> {
  public constructor(index: number,line: CodeLine,value: boolean,text: string,name?: string,consumed?: AbstractSymbol[]) {
    super(index,line,value,text,'bool',name,consumed);
  }

  public clone(index: number,text?: string,line?: CodeLine): BooleanValue {
    return new BooleanValue(index,line ?? this.line,this.value,text ?? this.text,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): BooleanValue {
    return new BooleanValue(index,line,this.value,name,name);
  }

  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (!(other instanceof BooleanValue)) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    return this.value == other.value;
  }
  get preview(): string { return this.value?'true':'false'; }
}
interface IColorValue {
  readonly hex: string;
  readonly text: '#000000' | '#FFFFFF';
}
class StringValue extends StorableSymbol<string> implements IComparable<StringValue> {
  private static readonly colorDict: Readonly<Record<string,string>> = {
    aliceblue: '#F0F8FF',
    antiquewhite: '#FAEBD7',
    aqua: '#00FFFF',
    aquamarine: '#7FFFD4',
    azure: '#F0FFFF',
    beige: '#F5F5DC',
    bisque: '#FFE4C4',
    black: '#000000',
    blanchedalmond: '#FFEBCD',
    blue: '#0000FF',
    blueviolet: '#8A2BE2',
    brown: '#A52A2A',
    burlywood: '#DEB887',
    cadetblue: '#5F9EA0',
    chartreuse: '#7FFF00',
    chocolate: '#D2691E',
    coral: '#FF7F50',
    cornflowerblue: '#6495ED',
    cornsilk: '#FFF8DC',
    crimson: '#DC143C',
    cyan: '#00FFFF',
    darkblue: '#00008B',
    darkcyan: '#008B8B',
    darkgoldenrod: '#B8860B',
    darkgray: '#A9A9A9',
    darkgrey: '#A9A9A9',
    darkgreen: '#006400',
    darkkhaki: '#BDB76B',
    darkmagenta: '#8B008B',
    darkolivegreen: '#556B2F',
    darkorange: '#FF8C00',
    darkorchid: '#9932CC',
    darkred: '#8B0000',
    darksalmon: '#E9967A',
    darkseagreen: '#8FBC8F',
    darkslateblue: '#483D8B',
    darkslategray: '#2F4F4F',
    darkslategrey: '#2F4F4F',
    darkturquoise: '#00CED1',
    darkviolet: '#9400D3',
    deeppink: '#FF1493',
    deepskyblue: '#00BFFF',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1E90FF',
    firebrick: '#B22222',
    floralwhite: '#FFFAF0',
    forestgreen: '#228B22',
    fuchsia: '#FF00FF',
    gainsboro: '#DCDCDC',
    ghostwhite: '#F8F8FF',
    gold: '#FFD700',
    goldenrod: '#DAA520',
    gray: '#808080',
    grey: '#808080',
    green: '#008000',
    greenyellow: '#ADFF2F',
    honeydew: '#F0FFF0',
    hotpink: '#FF69B4',
    indianred: '#CD5C5C',
    indigo: '#4B0082',
    ivory: '#FFFFF0',
    khaki: '#F0E68C',
    lavender: '#E6E6FA',
    lavenderblush: '#FFF0F5',
    lawngreen: '#7CFC00',
    lemonchiffon: '#FFFACD',
    lightblue: '#ADD8E6',
    lightcoral: '#F08080',
    lightcyan: '#E0FFFF',
    lightgoldenrodyellow: '#FAFAD2',
    lightgray: '#D3D3D3',
    lightgrey: '#D3D3D3',
    lightgreen: '#90EE90',
    lightpink: '#FFB6C1',
    lightsalmon: '#FFA07A',
    lightseagreen: '#20B2AA',
    lightskyblue: '#87CEFA',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#B0C4DE',
    lightyellow: '#FFFFE0',
    lime: '#00FF00',
    limegreen: '#32CD32',
    linen: '#FAF0E6',
    magenta: '#FF00FF',
    maroon: '#800000',
    mediumaquamarine: '#66CDAA',
    mediumblue: '#0000CD',
    mediumorchid: '#BA55D3',
    mediumpurple: '#9370DB',
    mediumseagreen: '#3CB371',
    mediumslateblue: '#7B68EE',
    mediumspringgreen: '#00FA9A',
    mediumturquoise: '#48D1CC',
    mediumvioletred: '#C71585',
    midnightblue: '#191970',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    navy: '#000080',
    oldlace: '#FDF5E6',
    olive: '#808000',
    olivedrab: '#6B8E23',
    orange: '#FFA500',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    peachpuff: '#FFDAB9',
    peru: '#CD853F',
    pink: '#FFC0CB',
    plum: '#DDA0DD',
    powderblue: '#B0E0E6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#FF0000',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    salmon: '#FA8072',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    silver: '#C0C0C0',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    tan: '#D2B48C',
    teal: '#008080',
    thistle: '#D8BFD8',
    tomato: '#FF6347',
    turquoise: '#40E0D0',
    violet: '#EE82EE',
    wheat: '#F5DEB3',
    white: '#FFFFFF',
    whitesmoke: '#F5F5F5',
    yellow: '#FFFF00',
    yellowgreen: '#9ACD32',
  };

  public constructor(index: number,line: CodeLine,value: string,text: string,name?: string,consumed?: AbstractSymbol[]) {
    super(index,line,'"'+value+'"',text,'str',name,consumed);
  }

  public clone(index: number,text?: string,line?: CodeLine): StringValue {
    return new StringValue(index,line ?? this.line,this.rawValue,text ?? this.text,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): StringValue {
    return new StringValue(index,line,this.rawValue,name,name);
  }

  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (!(other instanceof StringValue)) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    return this.value.replace(/\u00a0/g,' ') == other.value.replace(/\u00a0/g,' ');
  }
  public compare(other: StringValue,type: '>'|'>='|'<'|'<='): boolean {
    if (type == '<') {
      return this.value < other.value;
    } else if (type == '<=') {
      return this.value <= other.value;
    } else if (type == '>') {
      return this.value > other.value;
    } else if (type == '>=') {
      return this.value >= other.value;
    }
    return false;
  }

  // get preview(): string { return '"' + this.value + '"'; }
  get preview(): string { return this.value; }
  get rawValue(): string { return this.value.slice(1,-1); }
  get asStringVector(): StringVector {
    const innerStringList: StringValue[] = [];
    for (const char of this.value) {
      innerStringList.push(new StringValue(-1,this.line,char,''));
    }
    return new StringVector(-1,this.line,innerStringList,'');
  }
  get size(): number { return this.value.length; }

  get isHex(): boolean {
    return this.colorData != undefined;
  }
  get colorData(): IColorValue | undefined {
    const color =  StringValue.colorDict[this.text.slice(1,-1).toLowerCase().replace(/_/g,'').replace(/-/g,'').replace(/ /g,'')]
      ?? SuperString.standardHexValue(this.text.slice(1,-1));
    if (color == undefined) {
      return undefined;
    }
    return {
      hex: color,
      text: SuperString.getHexBrightness(color)>0.3?'#000000':'#FFFFFF'
    };
  }
}
class NoneType extends StorableSymbol<undefined> {
  public constructor(index: number,line: CodeLine,text: string,name?: string) {
    super(index,line,undefined,text,'none',name);
  }

  public clone(index: number,text?: string,line?: CodeLine): NoneType {
    return new NoneType(index,line ?? this.line,text ?? this.text,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): NoneType {
    return new NoneType(index,line,name,name);
  }
  public equals(other: AbstractSymbol): boolean {
    return other instanceof NoneType;
  }
  get preview(): string { return 'none'; }

  public castableTo(symbolType: SymbolType): boolean {
    return symbolType == 'none';    
  }
}

// ~ KEYABLE ~

interface IPropertyOption {
  readonly type: SymbolType;
  readonly name: string;
  readonly value: string;
}
type AbstractKeyable = KeyableSymbol<SymbolValue>;
abstract class KeyableSymbol<A extends SymbolValue> extends StorableSymbol<A> {
  public abstract propertyNames: (string|undefined)[] | undefined;
  abstract getNamedProperty(index: AbstractSymbol | string,line: CodeLine): AbstractStorable | CompilationError;

  public static getPropName(index: AbstractSymbol | string): string {
    if (typeof index == 'string') { return index; }
    return (typeof index.value=='string'?index.value:undefined) ?? index.name ?? index.text;
  }

  get options(): IPropertyOption[] | undefined {
    if (!this.propertyNames) {
      return undefined;
    }
    const options: IPropertyOption[] = [];
    const pseudo = CodeLine.Unlinked();
    for (const name of this.propertyNames.filter(e => e != undefined)) {
      const val = this.getNamedProperty(name!,pseudo);
      if (val instanceof CompilationError) {
        continue;
      }
      let value: string;
      if (val instanceof BuiltInFunction) {
        value = val.signature;
      } else if (val instanceof Variable) {
        value = 'none';
      } else {
        value = val.preview;
      }
      options.push({name:name!,type:val.type,value:value});
    }
    return options;
  }
}

// ~ VECTORS ~

type Vectorable = AbstractStorable;
type AbstractVector = GenericVector<AbstractStorable[]>;
class GenericVector<A extends AbstractStorable[]> extends KeyableSymbol<A> {
  public readonly indexNames?: ReadonlyArray<string|undefined>;

  protected constructor(index: number,line: CodeLine,value: A,text: string,type: SymbolType,name?: string,consumed?: AbstractSymbol[],indexNames?: FlexArray<string|undefined>) {
    super(index,line,value,text,type,name,consumed);
    if ((indexNames?.filter(e => e != undefined).length ?? -1) > 0) {
      this.indexNames = indexNames;
    }
    if (this.indexNames && this.indexNames.length != this.value.length) {
      throw new Error('Wrong number of index names');
    }
  }

  public static getInnerType(symbolType: SymbolType): StorableSymbolType | undefined {
    switch(symbolType) {
      case 'list': return 'any';
      case 'bvec': return 'bool';
      case 'nvec': return 'num';
      case 'svec': return 'str';
      case 'vvec': return 'var';
      case 'nmtx': return 'nvec';
      case 'vmtx': return 'vvec';
      case 'avec': return 'alias';
      case 'mvec': return 'meas';
      case 'dvec': return 'date';
      case 'ovec': return 'offset';
    }
  }
  public static isVectorable(x: any): x is Vectorable {
    return x instanceof StorableSymbol;
  }
  private static isSingleTypeArray(x: any[]): x is Vectorable[] {
    if (!GenericVector.isVectorable(x[0])) {
      return false;
    }
    for (let i = 1; i < x.length; i++) {
      if (typeof x[i] != 'object' || x[0].constructor != x[i].constructor) {
        return false;
      }
    }
    return true;
  }
  public static FromArray(values: AbstractSymbol[],line: CodeLine,namedIndexes?: FlexArray<string|undefined>,asGVEC: boolean = false,index: number = -1,text: string = '',name?: string): AbstractVector | CompilationError {
    if (namedIndexes && namedIndexes.length != values.length) {
      console.trace();
      console.log(values.map(e => e.toString()),namedIndexes);
      return new CompilationError(ErrorName.Vector_NameIndexCount,values,values,'GenVev.FromArray sindex count check');
    }
    if (asGVEC) {
      return new GenericVector(index,line,values as AbstractStorable[],text,'list',name,undefined,namedIndexes);
    } if (values.length == 0) {
      return new EmptyVector(index,line,text,name,undefined,namedIndexes);
    } else if (!GenericVector.isSingleTypeArray(values) || values.some(e => e.type == 'none')) {
      const nonStorable = values.filter(e => !(e instanceof StorableSymbol));
      if (nonStorable.length == 0) {
        const aliasable = values.filter(e => e.castableTo('alias'));
        if (aliasable.length == values.length) {
          return new AliasVector(index,line,values.map(e => e.castTo('alias')),text,name,undefined,namedIndexes);
        }
        return new GenericVector(index,line,values as AbstractStorable[],text,'list',name,undefined,namedIndexes);
      }
      return new CompilationError(ErrorName.Vector_NonStorableValues,nonStorable,nonStorable,'StorableVector.FromArray check');
    } else if (values[0] instanceof NumberValue) {
      return new NumberVector(index,line,values as NumberValue[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof Variable) {
      return new VariableVector(index,line,values as Variable[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof NumberVector) {
      return new NumberMatrix(index,line,values as NumberVector[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof VariableVector) {
      return new VariableMatrix(index,line,values as VariableVector[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof BooleanValue) {
      return new BooleanVector(index,line,values as BooleanValue[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof StringValue) {
      return new StringVector(index,line,values as StringValue[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof Alias) {
      return new AliasVector(index,line,values as Alias[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof DateValue) {
      return new DateVector(index,line,values as DateValue[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof Measurement) {
      return new MeasurementVector(index,line,values as Measurement[],text,name,undefined,namedIndexes);
    } else if (values[0] instanceof Offset) {
      return new OffsetVector(index,line,values as Offset[],text,name,undefined,namedIndexes);
    }
    return new CompilationError(ErrorName.Vector_NonStorableValues,values,values,'StorableVector.FromArray final');
  }
  public static unifyIndexes(a: AbstractVector,b: AbstractVector): {map:number[],success:boolean,warning?:CompilationWarning} {
    const size = Math.max(a.size,b.size);
    if (a.propertyNames == undefined || b.propertyNames == undefined || a.propertyNames.includes(undefined) || b.propertyNames.includes(undefined)) {
      return {
        map: new Array(size).fill(null).map((e,i) => i),
        success: a == undefined && b == undefined,
        warning: ((a.propertyNames==undefined)!=(b.propertyNames==undefined))?new CompilationWarning(WarningName.OneVectorWithNamedIndexes,[a,b],[a,b],'StorableVector.unifyIndexes'):undefined
      };
    }
    const namedIndexesA = a.propertyNames.slice() as string[];
    const namedIndexesB = b.propertyNames.slice() as string[];
    const map = new Array(size).fill(null).map((e,i) => i);
    for (let i = 0; i < namedIndexesA.length; i++) {
      const index = namedIndexesB.indexOf(namedIndexesA[i]);
      if (index == -1) {
        return {
          map: new Array(size).fill(null).map((e,i) => i),
          success: false,
          warning: new CompilationWarning(WarningName.MismatchedNamesIndexes,[a,b],[a,b],'StorableVector.unifyIndexes')
        };
      }
      map[i] = index;
    }
    return {map:map,success:true};
  }

  get size(): number { return this.value.length; }
  get preview(): string {
    return `[size:${this.size}; ${this.value.slice(0,10).map((e,i) => {
      return ((this.propertyNames ?? [])[i]?this.propertyNames![i]+':':'') + e.preview;
    }).join(', ')}${this.size>10?'...':''}]`;
  }
  get propertyNames(): (string|undefined)[] | undefined { return this.indexNames?.slice(); }
  get innerType(): StorableSymbolType { return GenericVector.getInnerType(this.type)!; }

  /**
   * Get a specified value from the vector
   * @param index The index of the value to pull as a number indexed from 0
   * @param line The CodeLine in context
   * @returns The constant in the position or a compilation error
   */
  public get(index: number,line: CodeLine): DeArray<A> | CompilationError {
    if (!Number.isInteger(index)) {
      return new CompilationError(ErrorName.NIndex_NonInteger,undefined,undefined,'ConstantVector.checkIndex');
    }
    if (index < 0) {
      return new CompilationError(ErrorName.NIndex_NonPositive,undefined,undefined,'ConstantVector.checkIndex');
    }
    if (index >= this.size) {
      return new CompilationError(ErrorName.NIndex_OutOfBounds,undefined,undefined,'ConstantVector.checkIndex');
    }
    return this.value[index].clone(-1,undefined,line) as DeArray<A>;
  }
  public convertToZeroBased(index: NumberValue): number | undefined {
    if (index.value == 0 || !Number.isInteger(index.value)) {
      return undefined;
    } else if (index.value > 0) {
      return index.value - 1;
    } else {
      return this.size + index.value;
    }
  }
  public getFromSymbol(index: NumberValue | StringValue | ProxySymbol,line: CodeLine): DeArray<A> | CompilationError {
    if (index instanceof StringValue || index instanceof ProxySymbol) {
      return this.getNamedProperty(index,line);
    }
    const zeroBasedIndex = this.convertToZeroBased(index);
    if (zeroBasedIndex == undefined) {
      return new CompilationError(ErrorName.NIndex_OutOfBounds,undefined,undefined,'ConstantVector.getFromConstant = 0');
    }
    return this.get(zeroBasedIndex,line);
  }
  public getNamedProperty(index: AbstractSymbol,line: CodeLine): DeArray<A> | CompilationError {
    if (this.indexNames == undefined) {
      return new CompilationError(ErrorName.SIndex_NoneFound,this,this,'StorableVector.getNamedIndex()');
    }
    const value = KeyableSymbol.getPropName(index);
    const position = this.indexNames.indexOf(value);
    if (position == -1) {
      return new CompilationError(ErrorName.SIndex_Invalid,undefined,undefined,'StorableVector.getNamedIndex()');
    }
    return this.value[position].clone(-1,value,line) as DeArray<A>;
  }

  protected sliceList(start: number,end: number,step: number = 1): A {
    if (step == 1) {
      return this.value.slice(start,end) as A;
    }
    const pulledValues: AbstractSymbol[] = [];
    for (let i = start; i < Math.min(end,this.value.length); i += step) {
      pulledValues.push(this.value[i]);
    }
    return pulledValues as A;
  }
  protected sliceFromConstants(start: NumberValue | undefined,end: NumberValue | undefined,step: NumberValue | undefined): A | CompilationError {
    const startIndex = start ? this.convertToZeroBased(start) : 0;
    const endIndex = end ? this.convertToZeroBased(end) : this.size;
    const stepSize = step ? step.value : 1;
    if (startIndex == undefined) {
      return new CompilationError(ErrorName.Vector_InvalidIndex,start,undefined,'StorableVector.sliceFromConstants start check');
    }
    if (endIndex == undefined) {
      return new CompilationError(ErrorName.Vector_InvalidIndex,end,undefined,'StorableVector.sliceFromConstants end check');
    }
    if (startIndex > endIndex) {
      return new CompilationError(ErrorName.Vector_SliceFlipIndexes,[start,end],undefined,'StorableVector.sliceFromConstants flip check');
    }
    if (stepSize < 1) {
      return new CompilationError(ErrorName.Vector_SliceNonPositiveStep,step,step,'StorableVector.sliceFromConstants <1 step slice');
    }
    if (!Number.isInteger(stepSize)) {
      return new CompilationError(ErrorName.Vector_SliceNonIntegerStep,step,step,'StorableVector.sliceFromConstants non-int step slice');
    }
    return this.sliceList(startIndex,endIndex + (end?1:0),stepSize);
  }

  public clone(index: number,text?: string,line?: CodeLine): GenericVector<A> {
    return GenericVector.FromArray(this.value,line ?? this.line,this.propertyNames,this.type=='list',index,text ?? this.text,this.name) as GenericVector<A>;
  }
  public rename(index: number,name: string,line: CodeLine): GenericVector<A> {
    return GenericVector.FromArray(this.value,line,this.propertyNames,this.type=='list',index,name,name) as GenericVector<A>;
  }
  public equals(other: AbstractSymbol,withReference?: boolean): boolean {
    if (!(other instanceof GenericVector) || this.size != other.size) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    for (let i = 0; i < this.value.length; i++) {
      if (!this.value[i].equals(other.value[i])) {
        return false;
      }
    }
    return true;
  }

  public castableTo(symbolType: SymbolType): boolean {
    if (symbolType == 'list' || symbolType == 'any') {
      return true;
    }
    const innerType = GenericVector.getInnerType(symbolType);
    if (innerType == undefined) {
      return false;
    }
    for (const val of this.value) {
      if (!val.castableTo(innerType)) {
        return false;
      }
    }
    return true;
  }
  public castTo<T extends keyof IStorableTypes>(symbolType: T): IStorableTypes[T] {
    if (symbolType == 'any') {
      return this as unknown as IStorableTypes[T];
    }
    if (symbolType == 'list') {
      if (this.type == 'list') {
        return this as unknown as IStorableTypes[T];
      } else {
        return GenericVector.FromArray(this.value,this.line,this.propertyNames,true) as IStorableTypes[T];
      }
    }
    const innerType = GenericVector.getInnerType(symbolType);
    if (!this.castableTo(symbolType) || innerType == undefined) {
      throw new Error(`Vector of type ${this.type} cannot be cast to ${symbolType}`);
    }
    if (symbolType == this.type) {
      return this as unknown as IStorableTypes[T];
    }
    const castedValues: AbstractStorable[] = [];
    for (const val of this.value) {
      castedValues.push(val.castTo(innerType));
    }
    return GenericVector.FromArray(castedValues,this.line,this.propertyNames) as IStorableTypes[T];
  }

  public slice(start: NumberValue | undefined, end: NumberValue | undefined,step: NumberValue | undefined, line: CodeLine): GenericVector<A> | CompilationError {
    const slice = this.sliceFromConstants(start,end,step);
    if (slice instanceof CompilationError) {
      return slice;
    }
    return GenericVector.FromArray(slice,line) as GenericVector<A>;
  }
}
class EmptyVector extends GenericVector<AbstractStorable[]> {
  public constructor(index: number,line: CodeLine,text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: (string|undefined)[] | ReadonlyArray<string|undefined>) {
    super(index,line,[],text,'evec',name,consumed,indexNames);
  }
  
  public castableTo(symbolType: SymbolType): boolean {
    if (['bvec','nvec','svec','nmtx','vmtx','vvec','avec','list','mvec','dvec','ovec'].includes(symbolType)) {
      return true;
    }
    return super.castableTo(symbolType);
  }
  public castTo<T extends keyof IStorableTypes>(symbolType: T): IStorableTypes[T] {
    if (symbolType == 'bvec') {
      return new BooleanVector(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'nvec') {
      return new NumberVector(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'nmtx') {
      return new NumberMatrix(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'vvec') {
      return new VariableVector(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'svec') {
      return new StringVector(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'vmtx') {
      return new VariableMatrix(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'avec') {
      return new AliasVector(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'dvec') {
      return new DateVector(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'mvec') {
      return new MeasurementVector(-1,this.line,[],this.text) as IStorableTypes[T];
    } else if (symbolType == 'ovec') {
      return new OffsetVector(-1,this.line,[],this.text) as IStorableTypes[T];
    }
    return super.castTo(symbolType);
  }
}
class NumberVector extends GenericVector<NumberValue[]> implements Iterable<NumberValue> {
  public constructor(index: number,line: CodeLine,value: NumberValue[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: (string|undefined)[] | ReadonlyArray<string|undefined>) {
    const valueCopy: NumberValue[] = [];
    for (const val of value) {
      if (!val.castableTo('num')) {
        throw new Error(`type ${val.type} in vector of type cvec`);
      }
      valueCopy.push(val.castTo('num'));
    }
    super(index,line,valueCopy,text,'nvec',name,consumed,indexNames);
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }

  public static buildRange(range: IVectorRange,reportingSymbol: MessageLocation): number[] | CompilationError {
    if (range.from == undefined) {
      return new CompilationError(ErrorName.For_NoStartPoint,reportingSymbol,reportingSymbol,'buildRange start point');
    }
    if (range.to == undefined && range.until == undefined) {
      return new CompilationError(ErrorName.For_NoEndPoint,reportingSymbol,reportingSymbol,'buildRange end point');
    }
    if (range.to != undefined && range.until != undefined) {
      return new CompilationError(ErrorName.For_BothToAndUntil,reportingSymbol,reportingSymbol,'buildRange end point');
    }
    if (range.step == 0) {
      return new CompilationError(ErrorName.For_StepIsZero,reportingSymbol,reportingSymbol,'buildRange step=0');
    }
    const end = range.to ?? range.until!;
    if (range.from == end) {
      return new CompilationError(ErrorName.For_SameStartAndStop,reportingSymbol,reportingSymbol,'buildRange start=end');
    }
    const dxn = range.from < end ? 1 : -1;
    if ((dxn == -1 && (range.step ?? -1) > 0) || (dxn == 1 && (range.step ?? 1) < 0)) {
      return new CompilationError(ErrorName.For_InvalidStep,reportingSymbol,reportingSymbol,'buildRange step check');
    }
    const values: number[] = range.prepend ?? [];
    const include: number[] = (range.include ?? []).sort((a,b) => a - b);
    for (let a = range.from, i = 0; dxn==1?(range.to?a<=range.to:a<range.until!):(range.to?a>=range.to:a>range.until!); a += (range.step ?? 1), i++) {
      if ((range.exindex ?? []).includes(i)) {
        continue;
      }
      values.push(a);
      for (const val of include) {
        if (val < values[values.length-1]) {
          const insertVal = include.shift()!;
          if (!values.includes(insertVal)) {
            values.splice(values.length-1,0,insertVal);
          }
        } else {
          break;
        }
      }
    }
    for (const val of include) {
      values.push(val);
    }
    if (range.append) {
      for (const val of range.append) {
        values.push(val);
      }
    }
    if (range.except) {
      for (let i = 0; i < values.length; i++) {
        if (range.except.includes(values[i])) {
          values.splice(i,1);
        }
      }
    }
    return values;
  }

  public scale(C: NumberValue): NumberVector {
    const values: NumberValue[] = [];
    for (const v of this.value) {
      values.push( new NumberValue(-1,this.line,v.value*C.value,'') );
    }
    return new NumberVector(-1,this.line,values,'');
  }
  public each(other: NumberVector,type: 'addeach' | 'subeach' | 'multeach' | 'diveach'): CompilationError | {vector:NumberVector,warning?:CompilationWarning} {
    if (this.size != other.size) {
      return new CompilationError(ErrorName.Each_VectorSizeMismatch,[this,other],[this,other],'ConstantVector.each');
    }
    const valueList: NumberValue[] = [];
    const indexMap = GenericVector.unifyIndexes(this,other);
    for (let i = 0; i < this.value.length; i++) {
      const thisValue = this.value[i].value;
      const otherValue = other.value[indexMap.map[i]].value;
      if (type == 'diveach' && otherValue == 0) {
        return new CompilationError(ErrorName.Division_ByZero,other,other,'ConstantVector.each div by 0');
      }
      let value: number;
      if (type == 'addeach') {
        value = thisValue + otherValue;
      } else if (type == 'subeach') {
        value = thisValue - otherValue;
      } else if (type == 'multeach') {
        value = thisValue * otherValue;
      } else { //diveach
        value = thisValue / otherValue;
      }
      valueList.push( new NumberValue(-1,other.line,value,'') );
    }
    return {
      vector: new NumberVector(-1,other.line,valueList,''),
      warning: indexMap.warning
    };
  }
  public map(fxn: (e:number,i:number)=>number): NumberVector | CompilationError {
    const constantValues: NumberValue[] = [];
    for (let i = 0; i < this.value.length; i++) {
      const result = fxn(this.value[i].value,i);
      if (isNaN(result) || result == undefined) {
        return new CompilationError(ErrorName.IllegalMapOperation,this,this,'ConstantVector.map at index '+i);
      }
      constantValues.push(new NumberValue(-1,this.line,result,''));
    }
    return new NumberVector(-1,this.line,constantValues,'');
  }
  public has(fxn: (e:number,i:number)=>boolean): boolean {
    for (let i = 0; i < this.value.length; i++) {
      if (fxn(this.value[i].value,i)) {
        return true;
      }
    }
    return false;
  }
  public count(fxn: (e:number,i:number)=>boolean): number {
    let count = 0;
    for (let i = 0; i < this.value.length; i++) {
      if (fxn(this.value[i].value,i)) {
        count++;
      }
    }
    return count;
  }

  get asNumberArray(): number[] {
    return this.value.map(e => e.value);
  }
  get magnitude(): number {
    return Math.sqrt( this.value.map(e => e.value).reduce((sum,n) => n*n+sum,0) );
  }
}
class VariableVector extends GenericVector<Variable[]> implements Iterable<Variable> {
  public constructor(index: number,line: CodeLine,value: Variable[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: (string|undefined)[] | ReadonlyArray<string|undefined>) {
    const valueCopy: Variable[] = [];
    for (const val of value) {
      if (!val.castableTo('var')) {
        throw new Error(`type ${val.type} in vector of type vvec`);
      }
      valueCopy.push(val.castTo('var'));
    }
    super(index,line,valueCopy,text,'vvec',name,consumed,indexNames);
    for (const v of value) {
      v.addFallback(this);
    }
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }

  public delete(): void {
    super.delete();
    for (const v of this.value) {
      v.removeFallback(this);
    }
  }
}
class AliasVector extends GenericVector<Alias[]> implements Iterable<Alias> {
  public constructor(index: number,line: CodeLine,value: Alias[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: (string|undefined)[] | ReadonlyArray<string|undefined>) {
    const valueCopy: Alias[] = [];
    for (const val of value) {
      if (!val.castableTo('alias')) {
        throw new Error(`type ${val.type} in vector of type vvec`);
      }
      valueCopy.push(val.castTo('alias'));
    }
    super(index,line,valueCopy,text,'avec',name,consumed,indexNames);
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }
}
class BooleanVector extends GenericVector<BooleanValue[]> implements Iterable<BooleanValue> {
  public constructor(index: number,line: CodeLine,value: BooleanValue[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: FlexArray<string|undefined>) {
    const valueCopy: BooleanValue[] = [];
    for (const val of value) {
      if (!val.castableTo('bool')) {
        throw new Error(`type ${val.type} in vector of type bool`);
      }
      valueCopy.push(val.castTo('bool'));
    }
    super(index,line,valueCopy,text,'bvec',name,consumed,indexNames);
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }
}
class StringVector extends GenericVector<StringValue[]> implements Iterable<StringValue> {
  public constructor(index: number,line: CodeLine,value: StringValue[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: FlexArray<string|undefined>) {
    const valueCopy: StringValue[] = [];
    for (const val of value) {
      if (!val.castableTo('str')) {
        throw new Error(`type ${val.type} in vector of type svec`);
      }
      valueCopy.push(val.castTo('str'));
    }
    super(index,line,valueCopy,text,'svec',name,consumed,indexNames);
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }

  get asStringValue(): StringValue {
    let value = '';
    for (const str of this.value) {
      value += str.value;
    }
    return new StringValue(-1,this.line,value,'');
  }
  get asStringArray(): string[] {
    return this.value.map(e => e.value);
  }
}
class DateVector extends GenericVector<DateValue[]> implements Iterable<DateValue> {
  public constructor(index: number,line: CodeLine,value: DateValue[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: FlexArray<string|undefined>) {
    const valueCopy: DateValue[] = [];
    for (const val of value) {
      if (!val.castableTo('date')) {
        throw new Error(`type ${val.type} in vector of type dvec`);
      }
      valueCopy.push(val.castTo('date'));
    }
    super(index,line,valueCopy,text,'dvec',name,consumed,indexNames);
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }
}
class MeasurementVector extends GenericVector<Measurement[]> implements Iterable<Measurement> {
  public constructor(index: number,line: CodeLine,value: Measurement[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: FlexArray<string|undefined>) {
    const valueCopy: Measurement[] = [];
    for (const val of value) {
      if (!val.castableTo('meas')) {
        throw new Error(`type ${val.type} in vector of type mvec`);
      }
      valueCopy.push(val.castTo('meas'));
    }
    super(index,line,valueCopy,text,'mvec',name,consumed,indexNames);
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }
}
class OffsetVector extends GenericVector<Offset[]> implements Iterable<Offset> {
  public constructor(index: number,line: CodeLine,value: Offset[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: FlexArray<string|undefined>) {
    const valueCopy: Offset[] = [];
    for (const val of value) {
      if (!val.castableTo('offset')) {
        throw new Error(`type ${val.type} in vector of type mvec`);
      }
      valueCopy.push(val.castTo('offset'));
    }
    super(index,line,valueCopy,text,'ovec',name,consumed,indexNames);
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }
}

// ~ MATRICES ~

type AbstractMatrix = StorableMatrix<NumberVector[] | VariableVector[]>;
abstract class StorableMatrix<A extends NumberVector[] | VariableVector[]> extends GenericVector<A> {
  public readonly rowCount: number;
  public readonly maxColCount: number;
  public readonly minColCount: number;

  public constructor(index: number,line: CodeLine,value: A,text: string,type: SymbolType,name?: string,consumed?: AbstractSymbol[],indexNames?: (string|undefined)[] | ReadonlyArray<string|undefined>) {
    let maxColCount = 0;
    let minColCount = Infinity;
    for (const val of value) {
      maxColCount = Math.max(val.size,maxColCount);
      minColCount = Math.min(val.size,minColCount);
    }
    super(index,line,value,text,type,name,consumed,indexNames);
    this.rowCount = value.length;
    this.maxColCount = maxColCount;
    this.minColCount = minColCount;
  }

  public sameDimensionsAs(other: AbstractMatrix): boolean {
    if (this.rowCount != other.rowCount || this.minColCount != other.minColCount || this.maxColCount != other.maxColCount) {
      return false;
    }
    if (this.isRectangular && other.isRectangular) {
      return true;
    }
    for (let i = 0; i < this.value.length; i++) {
      if (this.value[i].size != other.value[i]?.size) {
        return false;
      }
    }
    return true;
  }

  public getColumn(index: number): DeArray<A> | CompilationError {
    if (!Number.isInteger(index)) {
      return new CompilationError(ErrorName.NIndex_NonInteger,undefined,undefined,'ConstantMatrix.getColumn');
    }
    if (index < 0) {
      return new CompilationError(ErrorName.NIndex_NonPositive,undefined,undefined,'ConstantMatrix.getColumn');
    }
    if (index >= this.maxColCount) { //quick pre-check
      return new CompilationError(ErrorName.NIndex_OutOfBounds,undefined,undefined,'ConstantMatrix.getColumn');
    }
    const elements: (NumberValue|Variable)[] = [];
    for (let i = 0; i < this.rowCount; i++) {
      const compositeVector = this.value[i];
      if (index >= compositeVector.value.length) {
        return new CompilationError(ErrorName.NIndex_OutOfBounds,undefined,undefined,'ConstantMatrix.getColumn');
      }
      elements.push(compositeVector.value[index]);
    }
    return GenericVector.FromArray(elements,this.line) as DeArray<A> | CompilationError;
  }
  public getColumnFromConstant(index: NumberValue): DeArray<A> | CompilationError {
    const zeroBasedIndex = this.convertToZeroBasedColumn(index);
    if (zeroBasedIndex == undefined) {
      return new CompilationError(ErrorName.NIndex_OutOfBounds,undefined,undefined,'ConstantVector.getFromConstant = 0');
    }
    return this.getColumn(zeroBasedIndex);
  }
  public convertToZeroBasedColumn(index: NumberValue): number | undefined {
    if (index.value == 0 || !Number.isInteger(index.value)) {
      return undefined;
    } else if (index.value > 0) {
      return index.value - 1;
    } else {
      return this.maxColCount + index.value;
    }
  }
  protected sliceColumnList(start: number,end: number,step: number = 1): A | CompilationError {
    const innerValues: (NumberVector|VariableVector)[] = [];
    for (let i = start; i < Math.min(end,this.value.length); i += step) {
      const column = this.getColumn(i);
      if (column instanceof CompilationError) {
        return column;
      }
      innerValues.push(column);
    }
    return innerValues as A;
  }
  protected sliceColumnFromConstants(start: NumberValue | undefined,end: NumberValue | undefined,step: NumberValue | undefined): A | CompilationError {
    const startIndex = start ? this.convertToZeroBasedColumn(start) : 0;
    const endIndex = end ? this.convertToZeroBasedColumn(end) : this.size;
    const stepSize = step ? step.value : 1;
    if (startIndex == undefined) {
      return new CompilationError(ErrorName.Vector_InvalidIndex,start,undefined,'StorableVector.sliceFromConstants start check');
    }
    if (endIndex == undefined) {
      return new CompilationError(ErrorName.Vector_InvalidIndex,end,undefined,'StorableVector.sliceFromConstants end check');
    }
    if (startIndex > endIndex) {
      return new CompilationError(ErrorName.Vector_SliceFlipIndexes,[start,end],undefined,'StorableVector.sliceFromConstants flip check');
    }
    if (stepSize < 1) {
      return new CompilationError(ErrorName.Vector_SliceNonPositiveStep,step,step,'StorableVector.sliceFromConstants <1 step slice');
    }
    if (!Number.isInteger(stepSize)) {
      return new CompilationError(ErrorName.Vector_SliceNonIntegerStep,step,step,'StorableVector.sliceFromConstants non-int step slice');
    }
    return this.sliceColumnList(startIndex,endIndex + (end?1:0),stepSize);
  }
  public abstract sliceColumn(start: NumberValue | undefined,end: NumberValue | undefined,step: NumberValue | undefined,line: CodeLine): GenericVector<A> | CompilationError;

  get isRectangular(): boolean { return this.maxColCount == this.minColCount; }
  get isSquare(): boolean {
    return this.maxColCount == this.rowCount && this.minColCount == this.rowCount;
  }

  get preview(): string {
    const MAX_DISPLAY_SIZE = 3;
    const base = this.isRectangular?`[dim:${this.rowCount}x${this.minColCount}; `:
      `[dim:${this.rowCount}x${this.minColCount}-${this.maxColCount}; `;
    const data: string[] = [];
    for (let i = 0; i < Math.min(this.rowCount,MAX_DISPLAY_SIZE); i++) {
      data.push('[' + this.value[i].value.slice(0,MAX_DISPLAY_SIZE).map(e => e.preview).join(' ,') + (this.value[i].size>MAX_DISPLAY_SIZE?'...':'') + ']');
    }
    return base + data.join(' , ') + (this.rowCount>MAX_DISPLAY_SIZE?'...':'') + ' ]';
  }
}
class NumberMatrix extends StorableMatrix<NumberVector[]> implements Iterable<NumberVector> {
  public readonly determinate: number | null;

  public constructor(index: number,line: CodeLine,value: NumberVector[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: FlexArray<string|undefined>) {
    const valueCopy: NumberVector[] = [];
    for (const val of value) {
      if (!val.castableTo('nvec')) {
        throw new Error(`type ${val.type} in vector of type cmtx`);
      }
      valueCopy.push(val.castTo('nvec'));
    }
    super(index,line,valueCopy,text,'nmtx',name,consumed,indexNames);
    if (this.isSquare && this.rowCount > 0) {
      const field: number[][] = [];
      for (const row of this.value) {
        field.push(row.asNumberArray);
      }
      this.determinate = new Matrix(field).determinate;
    } else {
      this.determinate = null;
    }
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }

  public static FromNumericMatrix(matrix: Matrix,line: CodeLine): NumberMatrix {
    const field: NumberVector[] = [];
    for (let r = 0; r < matrix.rowCount; r++) {
      const vectorValues: NumberValue[] = matrix.getRow(r).map(e => new NumberValue(-1,line,e,''));
      field.push(new NumberVector(-1,line,vectorValues,''));
    }
    return new NumberMatrix(-1,line,field,'');
  }

  get trace(): number | null {
    if (!this.isSquare) {
      return null;
    }
    let trace = 0;
    for (let i = 0; i < this.value.length; i++) {
      trace += this.value[i].value[i].value;
    }
    return trace;
  }
  get asNumericMatrix(): Matrix | null {
    if (!this.isRectangular || this.rowCount == 0 || this.maxColCount == 0) {
      return null;
    }
    const field: number[][] = [];
    for (const vector of this.value) {
      field.push(vector.asNumberArray);
    }
    return new Matrix(field);
  }

  public clone(index: number,text?: string,line?: CodeLine): NumberMatrix {
    return new NumberMatrix(index,line ?? this.line,this.value,text ?? this.text,this.name,undefined,this.indexNames);
  }
  public rename(index: number,name: string,line: CodeLine): NumberMatrix {
    return new NumberMatrix(index,line,this.value,name,name,undefined,this.indexNames);
  }

  public sliceColumn(start: NumberValue | undefined, end: NumberValue | undefined,step: NumberValue | undefined, line: CodeLine): NumberMatrix | CompilationError {
    const slice = this.sliceColumnFromConstants(start,end,step);
    if (slice instanceof CompilationError) {
      return slice;
    }
    return new NumberMatrix(-1,line,slice,'');
  }
  public slice(start: NumberValue | undefined, end: NumberValue | undefined,step: NumberValue | undefined, line: CodeLine): NumberMatrix | CompilationError {
    const slice = this.sliceFromConstants(start,end,step);
    if (slice instanceof CompilationError) {
      return slice;
    }
    return new NumberMatrix(-1,line,slice,'');
  }

  public scale(C: NumberValue): NumberMatrix {
    const values: NumberVector[] = [];
    for (const v of this.value) {
      values.push( v.scale(C) );
    }
    return new NumberMatrix(-1,this.line,values,'');
  }
  public map(fxn: (e:number,i:number) => number): NumberMatrix | CompilationError {
    const innerVectors: NumberVector[] = [];
    for (const val of this.value) {
      const result = val.map(fxn);
      if (result instanceof CompilationError) {
        return result;
      }
      innerVectors.push(result);
    }
    return new NumberMatrix(-1,this.line,innerVectors,'');
  }

  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (!(other instanceof StorableMatrix) || !other.castableTo(this.type)) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    if (!this.sameDimensionsAs(other)) {
      return false;
    }
    for (let i = 0; i < this.value.length; i++) {
      if (!this.value[i].equals(other.value[i])) {
        return false;
      }
    }
    return true;
  }
}
class VariableMatrix extends StorableMatrix<VariableVector[]> implements Iterable<VariableVector> {
  public constructor(index: number,line: CodeLine,value: VariableVector[],text: string,name?: string,consumed?: AbstractSymbol[],indexNames?: (string|undefined)[] | ReadonlyArray<string|undefined>) {
    const valueCopy: VariableVector[] = [];
    for (const val of value) {
      if (!val.castableTo('vvec')) {
        throw new Error(`type ${val.type} in vector of type vmtx`);
      }
      valueCopy.push(val.castTo('vvec'));
    }
    super(index,line,valueCopy,text,'vmtx',name,consumed,indexNames);
  }
  *[Symbol.iterator]() {
    for (const v of this.value) {
      yield v;
    }
  }

  public clone(index: number,text?: string,line?: CodeLine): VariableMatrix {
    return new VariableMatrix(index,line ?? this.line,this.value,text ?? this.text,this.name,undefined,this.indexNames);
  }
  public rename(index: number,name: string,line: CodeLine): VariableMatrix {
    return new VariableMatrix(index,line,this.value,name,name,undefined,this.indexNames);
  }

  public sliceColumn(start: NumberValue | undefined, end: NumberValue | undefined,step: NumberValue | undefined, line: CodeLine): VariableMatrix | CompilationError {
    const slice = this.sliceColumnFromConstants(start,end,step);
    if (slice instanceof CompilationError) {
      return slice;
    }
    return new VariableMatrix(-1,line,slice,'');
  }
  public slice(start: NumberValue | undefined, end: NumberValue | undefined,step: NumberValue | undefined, line: CodeLine): VariableMatrix | CompilationError {
    const slice = this.sliceFromConstants(start,end,step);
    if (slice instanceof CompilationError) {
      return slice;
    }
    return new VariableMatrix(-1,line,slice,'');
  }

  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (!(other instanceof StorableMatrix) || !other.castableTo(this.type)) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    if (!this.sameDimensionsAs(other)) {
      return false;
    }
    for (let i = 0; i < this.value.length; i++) {
      if (!this.value[i].equals(other.value[i])) {
        return false;
      }
    }
    return true;
  }
}

// ~ ADVANCED FRAMES ~

class DataFrame extends GenericVector<AbstractVector[]> {
  public readonly columnNames: ReadonlyArray<string>;
  private readonly rowCount: number;

  public constructor(index: number,line: CodeLine,value: AbstractVector[],text: string,columnNames: FlexArray<string>,name?: string) {
    super(index,line,value,text,'frame',name);
    this.columnNames = columnNames;
    this.rowCount = value[0]?.size ?? 0;
  }

  public static FromRows(rows: AbstractVector[],line: CodeLine,columnNames: FlexArray<string>): DataFrame | CompilationError {
    if (rows.length == 0) {
      return new DataFrame(-1,line,[],'',columnNames);
    }
    const grid: AbstractStorable[][] = new Array(columnNames.length).fill(null).map(e => []);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].size != columnNames.length) {
        return new CompilationError(ErrorName.Frame_ColDimMismatch,[rows[0],rows[i]],[rows[0],rows[i]],'Frame.FromRows size check');
      }
      for (let j = 0; j < rows[i].size; j++) {
        grid[j].push(rows[i].value[j]);
      }
    }
    const vectors: AbstractVector[] = [];
    for (const column of grid) {
      const columnVector = GenericVector.FromArray(column,line);
      if (columnVector instanceof CompilationError) {
        return columnVector;
      }
      vectors.push(columnVector);
    }
    return new DataFrame(-1,line,vectors,'',columnNames);
  }

  get size(): number { return this.rowCount; }
  get propertyNames(): string[] {
    return this.columnNames.slice();
  }
  public getNamedProperty(index: AbstractSymbol,line: CodeLine): AbstractVector | CompilationError {
    const name = KeyableSymbol.getPropName(index);
    if (this.columnNames.includes(name)) {
      return this.value[this.columnNames.indexOf(name)].clone(-1,name,line);
    }
    return new CompilationError(ErrorName.SIndex_Invalid,index,index,'Frame.getNamedProp not found');
  }

  /**
   * Get a specified value from the vector
   * @param index The index of the value to pull as a number indexed from 0
   * @param line The CodeLine in context
   * @returns The constant in the position or a compilation error
   */
  public get(index: number,line: CodeLine): AbstractVector | CompilationError {
    if (!Number.isInteger(index)) {
      return new CompilationError(ErrorName.NIndex_NonInteger,undefined,undefined,'ConstantVector.checkIndex');
    }
    if (index < 0) {
      return new CompilationError(ErrorName.NIndex_NonPositive,undefined,undefined,'ConstantVector.checkIndex');
    }
    if (index >= this.size) {
      return new CompilationError(ErrorName.NIndex_OutOfBounds,undefined,undefined,'ConstantVector.checkIndex');
    }
    const vectorValues: AbstractStorable[] = [];
    for (const column of this.value) {
      const value = column.get(index,line);
      if (value instanceof CompilationError) {
        return value;
      }
      vectorValues.push(value);
    }
    return GenericVector.FromArray(vectorValues,line,this.columnNames);
  }

  protected sliceList(start: number,end: number,step: number = 1): AbstractVector[] {
    const pulledValues: AbstractVector[] = [];
    for (let i = start; i < Math.min(end,this.size); i += step) {
      const row = this.get(i,this.line);
      if (!(row instanceof CompilationError)) {
        pulledValues.push(row);
      }
    }
    return pulledValues;
  }
  public slice(start: NumberValue | undefined, end: NumberValue | undefined,step: NumberValue | undefined, line: CodeLine): DataFrame | CompilationError {
    const slice = this.sliceFromConstants(start,end,step);
    if (slice instanceof CompilationError) {
      return slice;
    }
    return DataFrame.FromRows(slice,line,this.columnNames);
  }

  public clone(index: number,text?: string,line?: CodeLine): DataFrame {
    return new DataFrame(index,line ?? this.line,this.value,text ?? this.text,this.columnNames,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): DataFrame {
    return new DataFrame(index,line,this.value,name,this.columnNames,name);
  }
  get preview(): string {
    let str = `[dim:${this.size}x${this.columnNames.length}; `;
    const cols: string[] = [];
    for (let i = 0; i < this.value.length; i++) {
      cols.push(this.columnNames[i]+': <'+this.value[i].type+'>');
    }
    return str + cols.join(', ') + ']';
  }

  public castTo<T extends keyof IStorableTypes>(symbolType: T): IStorableTypes[T] {
    if (symbolType == 'frame') {
      return this as unknown as IStorableTypes[T];
    }
    return super.castTo(symbolType);
  }
  public castableTo(symbolType: SymbolType): boolean {
    if (symbolType == 'frame') {
      return true;
    }
    return super.castableTo(symbolType);
  }
  public toString(): string {
    return `[frame:${this.size}x${this.columnNames.length}@${this.name ?? 'anonymous'}]`;
  }
}

// ~ BASIC SYMBOLS ~

class BasicSymbol extends ResolvingSymbol<string> {
  public constructor(index: number,line: CodeLine,text: string,type: 'keyword'|'declaration'|'proxy'|'domain'|'name'|'operator') {
    super(index,line,text,text,type);
  }

  public clone(index: number,text?: string,line?: CodeLine): BasicSymbol {
    return new BasicSymbol(index,line ?? this.line,text ?? this.text,this.type as 'keyword');
  }
}
type AbstractGroupingSymbol = GroupingSymbol<'('|')'|'['|']'|'{'|'}'>;
class GroupingSymbol<V extends ('('|')'|'['|']'|'{'|'}')> extends ResolvingSymbol<V> {
  public level: number = 0;
  public marksConstructedVector: boolean = false;

  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,value,'grouping');
  }
  public clone(index: number,text?: string,line?: CodeLine): GroupingSymbol<V> {
    return new GroupingSymbol(index,line ?? this.line,this.value);
  }
  public toString(): string {
    const s = super.toString();
    return s.substring(0,s.length-1) + ':' + this.level + s.charAt(s.length-1);
  }

  public matches(other: AbstractSymbol): boolean {
    if (!(other instanceof GroupingSymbol)) {
      return false;
    }
    return ((this.value == '(' && other.value == ')') || (this.value == ')' && other.value == '(') ||
      (this.value == '[' && other.value == ']') || (this.value == ']' && other.value == '[') ||
      (this.value == '{' && other.value == '}') || (this.value == '}' && other.value == '{')) &&
      (this.level == other.level);
  }

  get opening(): boolean { return this.value == '(' || this.value == '[' || this.value == '{'; }
  get closing(): boolean { return this.value == ')' || this.value == ']' || this.value == '}'; }
}
class ProxySymbol extends BasicSymbol {
  public displayAsVariable: boolean = false;

  constructor(index: number,line: CodeLine,text: string) {
    super(index,line,text,'proxy');
  }

  get asVariable(): Variable {
    const v = new Variable(-1,this.line,this.value);
    if (this.hasMessage.error) {
      v.addMarker('error');
    }
    if (this.hasMessage.warning) {
      v.addMarker('warning');
    }
    if (this.hasMessage.recommendation) {
      v.addMarker('recommendation');
    }
    return v;
  }
  get markers(): (MessageType|SymbolType|DisplaySymbolType)[] {
    if (this.displayAsVariable) {
      return ['var'];
    } 
    return super.markers;
  }
}
class NameSymbol extends BasicSymbol {
  constructor(index: number,line: CodeLine,text: string) {
    super(index,line,text,'name');
  }
}
class Piping extends BasicSymbol {
  public static readonly shortcut = '|>';

  public level: number = 0;

  public constructor(index: number,line: CodeLine) {
    super(index,line,Piping.shortcut,'operator');
  }
}
class Spread extends BasicSymbol {
  public static readonly shortcut = '...';
  public static readonly MAX_SIZE = 10;

  public constructor(index: number,line: CodeLine) {
    super(index,line,Spread.shortcut,'operator');
  }
}
class Append extends BasicSymbol {
  public static readonly shortcut = '<|';

  public constructor(index: number,line: CodeLine) {
    super(index,line,Append.shortcut,'operator');
  }
}

// ~ OPERATORS ~

enum OperatorPriority {
  Colon = 0,
  ValueComparision = 1,
  BinaryAndOr = 2,
  BinaryNot = 3,
  Comparison = 4,
  Addition = 5,
  PointwiseAddition = 6,
  Multiplication = 7,
  PointwiseMultiplication = 8,
  UnaryAddition = 9,
  Exponent = 10,
  Dot = 11,
  IfElse = 12,
  IfThen = 13,
}
const MAX_OPERATOR_PRIORITY = 13;

type AbstractOperator = Operator<string>;
abstract class Operator<V extends string> extends ResolvingSymbol<V> {
  public priority: number;

  public constructor(index: number,line: CodeLine,value: V,priority: OperatorPriority) {
    super(index,line,value,value,'operator');
    this.priority = priority;
  }
  public clone(index: number,text?: string,line?: CodeLine): ResolvingSymbol<V> {
    return Operator.Build(index,line ?? this.line,text ?? this.value) as ResolvingSymbol<V>;
  }
  public toString(): string {
    const s = super.toString();
    return s.substring(0,s.length-1) + ':' + this.priority + ']';
  }

  public static Build(index: number,line: CodeLine,value: string): ResolvingSymbol<string> {
    switch(value) {
      case '+': case '-':
        return new Addition(index,line,value);
      case '=': case '>': case '<': case '>=': case '<=':
        return new Equality(index,line,value);
      case '==': case '~=': case '===': case '~==':
        return new Comparison(index,line,value);
      case '*':
        return new Multiplication(index,line,value);
      case '/': case '%':
        return new Division(index,line,value);
      case 'mod':
        return new Modulo(index,line,value);
      case '^':
        return new Exponent(index,line,value);
      case '!':
        return new Factorial(index,line,value);
      case ',':
        return new Comma(index,line,value);
      case ':':
        return new Colon(index,line,value);
      case 'addeach': case 'subeach': case 'multeach': case 'diveach':
        return new ForEach(index,line,value);
      case "'":
        return new Transpose(index,line,value);
      case '~':
        return new BinaryNot(index,line,value);
      case '&': case '|': case 'xor': case 'nor':
        return new BinaryAndOr(index,line,value);
      case '?':
        return new QuestionMark(index,line,value);
    }
    return new ProxySymbol(index,line,value);
  }

  public abstract operate(arr: AbstractSymbol[]): {
    list: AbstractSymbol[],
    warning?: CompilationWarning,
    recommendation?: CompilationRecommendation
  } | CompilationError;
}
class Addition<V extends '+'|'-'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Addition);
  }

  private static validOperand(val: AbstractSymbol | undefined): val is AbstractStorable {
    return val instanceof StorableSymbol;
  }

  private combine(a: AbstractStorable | undefined,b: AbstractStorable): AbstractStorable | CompilationError {
    const sign = this.value=='+' ? 1 : -1;
    if ((a?.castableTo('num') || a == undefined) && b.castableTo('num')) {
      const aVal = a?.castTo('num')?.value ?? 0;
      const bVal = b.castTo('num').value;
      if (this.value == '+') {
        return new NumberValue(-1,this.line,aVal + bVal,'');
      } else {
        return new NumberValue(-1,this.line,aVal - bVal,'');
      }
    } else if (a == undefined && b.castableTo('var')) {
      return b.castTo('var');
    } else if (a?.castableTo('nvec') && b.castableTo('nvec')) {
      const aValues = a.castTo('nvec').value.map(e => e.clone(-1,undefined,a.line));
      const bValues = b.castTo('nvec').value.map(e => e.clone(-1,undefined,a.line));
      let resultValues: NumberValue[];
      if (this.value == '+') {
        resultValues = [...aValues,...bValues];
      } else {
        resultValues = [];
        outerLoop: for (const aVal of aValues) {
          for (const bVal of bValues) {
            if (aVal.equals(bVal)) {
              continue outerLoop;
            }
          }
          resultValues.push(aVal);
        }
      }
      return new NumberVector(-1,a.line,resultValues,'');
    } else if (a?.castableTo('vvec') && b.castableTo('vvec')) {
      const aValues = a.castTo('vvec').value.map(e => e.clone(-1,undefined,a.line));
      const bValues = b.castTo('vvec').value.map(e => e.clone(-1,undefined,a.line));
      let resultValues: Variable[];
      if (this.value == '+') {
        resultValues = [...aValues,...bValues];
      } else {
        resultValues = [];
        outerLoop: for (const aVal of aValues) {
          for (const bVal of bValues) {
            if (aVal.equals(bVal)) {
              continue outerLoop;
            }
          }
          resultValues.push(aVal);
        }
      }
      return new VariableVector(-1,a.line,resultValues,'');
    } else if (a == undefined && b.castableTo('nvec')) {
      if (this.value == '+') {
        return b.castTo('nvec').clone(-1,undefined,b.line);
      } else {
        const opposite: NumberValue[] = [];
        for (const val of b.castTo('nvec').value) {
          opposite.push( new NumberValue(-1,b.line,-val.value,'') );
        }
        return new NumberVector(-1,b.line,opposite,'');
      }
    } else if (a?.castableTo('str') && b.castTo('str')) {
      if (this.value == '+') {
        return new StringValue(-1,b.line,a.castTo('str').rawValue + b.castTo('str').rawValue,'');
      } else { //"-"
        const escapedStrB = b.castTo('str').rawValue.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
        const regex = new RegExp(escapedStrB,'g');
        return new StringValue(-1,b.line,a.castTo('str').rawValue.replace(regex,''),'');
      }
    } else if (a?.castableTo('alias') && b.castableTo('alias')) {
      const aliasA = a.castTo('alias');
      const aliasB = this.value=='+'?b.castTo('alias'):b.castTo('alias').opposite;
      const valueMap: Map<string|undefined,{val?:Variable,coeff:number}> = new Map();
      for (const set of [...aliasA.value,...aliasB.value]) {
        if (valueMap.has(set.val?.name)) { //already in map
          valueMap.set(
            set.val?.name,
          {val:set.val,coeff:valueMap.get(set.val?.name)!.coeff+set.coeff.value}
        );
      } else { //set first value
        valueMap.set(
          set.val?.name,
          {val:set.val,coeff:set.coeff.value}
          );
        }
      }
      const aliasValue: AliasValue = [];
      for (const set of valueMap.values()) {
        aliasValue.push({val:set.val,coeff:new NumberValue(-1,b.line,set.coeff,'')});
      }
      return new Alias(-1,b.line,aliasValue,'');
    } else if (a?.castableTo('meas') && b.castableTo('meas')) {
      return Measurement.add(a.castTo('meas'),b.castTo('meas'),this.value=='+'?1:-1,a.line);
    } else if (a?.castableTo('offset') && b.castableTo('offset')) {
      const offsetValue: Mutable<IOffsetValue> = {};
      for (const name of keys(a.castTo('offset').value)) {
        offsetValue[name] = (offsetValue[name] ?? 0) + sign * a.castTo('offset').value[name]!;
      }
      for (const name of keys(b.castTo('offset').value)) {
        offsetValue[name] = (offsetValue[name] ?? 0) + sign * b.castTo('offset').value[name]!;
      }
      return new Offset(-1,a.line,offsetValue,'');
    } else if ((a?.castableTo('date') && b.castableTo('offset')) || (a?.castableTo('offset') && b.castableTo('date'))) {
      const date = a.castableTo('date')?a.castTo('date'):b.castTo('date');
      const offset = a.castableTo('date')?b.castTo('offset'):a.castTo('offset');
      const specified = date.specified;
      const copy = new Date(date.value);
      copy.setFullYear(copy.getFullYear() + sign * (offset.value.year ?? 0));
      copy.setMonth(copy.getMonth() + sign * (offset.value.month ?? 0));
      copy.setDate(copy.getDate() + sign * (offset.value.day ?? 0));
      copy.setHours(copy.getHours() + sign * (offset.value.hour ?? 0));
      copy.setMinutes(copy.getMinutes() + sign * (offset.value.minute ?? 0));
      copy.setSeconds(copy.getSeconds() + sign * (offset.value.second ?? 0));
      return new DateValue(-1,a.line,copy,'',{
        year: specified.year ?? (offset.value.year ?? 0) != 0,
        month: specified.month ?? (offset.value.month ?? 0) != 0,
        day: specified.day ?? (offset.value.day ?? 0) != 0,
        hour: specified.hour ?? (offset.value.hour ?? 0) != 0,
        minute: specified.minute ?? (offset.value.minute ?? 0) != 0,
        second: specified.second ?? (offset.value.second ?? 0) != 0,
      });
    } else if (a?.castableTo('date') && b.castableTo('date') && this.value == '-') {
      const ad = a.castTo('date');
      const bd = b.castTo('date');
      return new Offset(-1,a.line,{
        year: ad.value.getFullYear() - bd.value.getFullYear(),
        month: ad.value.getMonth() - bd.value.getMonth(),
        day: ad.value.getDate() - bd.value.getDate(),
        hour: ad.value.getHours() - bd.value.getHours(),
        minute: ad.value.getMinutes() - bd.value.getMinutes(),
        second: ad.value.getSeconds() - bd.value.getSeconds(),
      },'');
    }
    return new CompilationError(ErrorName.Add_UnknownOperands,[a,b],[a,b],'Addition.combine() unmatched types');
  }
  public operate(arr: AbstractSymbol[]): {list:AbstractSymbol[]} | CompilationError {
    const index = arr.indexOf(this);
    let sliceStart = index - 1;
    let sliceEnd = index + 1;
    let operandA = arr[index - 1] as AbstractSymbol | undefined;
    const operandB = arr[index + 1] as AbstractSymbol | undefined;
    if (operandB == undefined) {
      return new CompilationError(this.value=='+'?ErrorName.Add_UnknownOperands:ErrorName.Sub_UnknownOperands,[operandA,this],[this],'Addition.operate - undefined');
    }
    if (operandA == undefined) {
      sliceStart++;
    } else if ((operandA instanceof GroupingSymbol && operandA.opening) || operandA instanceof Operator) {
      operandA = undefined;
      sliceStart++;
    }
    if (operandA != undefined && !Addition.validOperand(operandA)) {
      return new CompilationError(this.value=='+'?ErrorName.Add_UnknownOperands:ErrorName.Sub_UnknownOperands,[operandA,this,operandB],[operandA],'Addition.operate - invalid');
    }
    if (!Addition.validOperand(operandB)) {
      return new CompilationError(this.value=='+'?ErrorName.Add_UnknownOperands:ErrorName.Sub_UnknownOperands,[operandA,this,operandB],[operandB],'Addition.operate - invalid');
    }
    const result = this.combine(operandA,operandB);
    if (result instanceof CompilationError) {
      return result;
    }
    if (operandA != undefined) {
      result.consumeStart(operandA);
    }
    result.consumeEnd(this);
    result.consumeEnd(operandB);
    return {list:[...arr.slice(0,sliceStart),result,...arr.slice(sliceEnd+1)]};
  }
}
class Multiplication<V extends '*'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Multiplication);
  }

  private static validOperand(val: AbstractSymbol | undefined): val is AbstractStorable {
    return val instanceof StorableSymbol;
  }

  private combine(a: AbstractStorable,b: AbstractStorable): {value?:AbstractStorable,error?:CompilationError,warning?:CompilationWarning} {
    if (a.castableTo('num') && b.castableTo('num')) {
      return {value:new NumberValue(-1,a.line,a.castTo('num').value * b.castTo('num').value,'')};
    } else if (a.castableTo('num') && b.castableTo('alias')) { //const*alias => alias
      return {value:b.castTo('alias').scale(a.castTo('num'))};
    } else if (b.castableTo('num') && a.castableTo('alias')) { //const*alias => alias
      return {value:a.castTo('alias').scale(b.castTo('num'))};
    } else if (a.castableTo('num') && b.castableTo('nvec')) { //const*cvec => cvec
      return {value:b.castTo('nvec').scale(a.castTo('num'))};
    } else if (b.castableTo('num') && a.castableTo('nvec')) { //const*cvec => cvec
      return {value:a.castTo('nvec').scale(b.castTo('num'))};
    } else if (a.castableTo('nvec') && b.castableTo('nvec')) {//cvec*cvec => const
      const aVector = a.castTo('nvec');
      const bVector = b.castTo('nvec');
      if (aVector.size != bVector.size) {
        return {error:new CompilationError(ErrorName.Mult_VectorSize,[a,b],[a,b],'Multiplication.combine')};
      }
      const values: number[] = [];
      const unification = GenericVector.unifyIndexes(aVector,bVector);
      for (let i = 0; i < aVector.size; i++) {
        values.push(aVector.value[i].value*bVector.value[unification.map[i]].value);
      }
      return {value:new NumberValue(-1,a.line,values.reduce((a,b)=>a+b,0),''),warning:unification.warning};
    } else if ((a.castableTo('nvec') && b.castableTo('vvec')) || (a.castableTo('vvec') && b.castableTo('nvec'))) { //cvec*vvec => alias
      const aVector = a.castableTo('nvec')?a.castTo('nvec'):a.castTo('vvec');
      const bVector = b.castableTo('nvec')?b.castTo('nvec'):b.castTo('vvec');
      if (aVector.size != bVector.size) {
        return {error:new CompilationError(ErrorName.Mult_VectorSize,[a,b],[a,b],'Multiplication.combine')};
      }
      const values: AliasValue = [];
      const unification = GenericVector.unifyIndexes(aVector,bVector);
      for (let i = 0; i < aVector.size; i++) {
        const aValue = aVector.value[i];
        const bValue = bVector.value[unification.map[i]];
        if (aValue.castableTo('num') && bValue.castableTo('var')) {
          values.push({
            coeff: aValue.castTo('num'),
            val: bValue.castTo('var'),
          });
        } else if (bValue.castableTo('num') && aValue.castableTo('var')) {
          values.push({
            coeff: bValue.castTo('num'),
            val: aValue.castTo('var'),
          });
        }
      }
      return {value:new Alias(-1,a.line,values,''),warning:unification.warning};
    } else if (a.castableTo('nmtx') && b.castableTo('nmtx')) {
      const aMatrix = a.castTo('nmtx').asNumericMatrix;
      const bMatrix = b.castTo('nmtx').asNumericMatrix;
      if (!a.castTo('nmtx').isRectangular || aMatrix == null) {
        return {error:new CompilationError(ErrorName.Mult_NonRect,a,a,'Multiplication.combine rect a check')};
      }
      if (!b.castTo('nmtx').isRectangular || bMatrix == null) {
        return {error:new CompilationError(ErrorName.Mult_NonRect,b,b,'Multiplication.combine rect b check')};
      }
      const product = aMatrix.multiply(bMatrix);
      if (product == null) {
        return {error:new CompilationError(ErrorName.Mult_InvalidDimensions,[a,b],[a,b],'Multiplication.combine dimension check')};
      }
      return {value:NumberMatrix.FromNumericMatrix(product,a.line)};
    } else if (a.castableTo('str') && b.castableTo('num')) {
      const multiplier = b.castTo('num').value;
      const base = a.castTo('str').rawValue;
      if (multiplier < 1 || !Number.isInteger(multiplier)) {
        return {error:new CompilationError(ErrorName.Mult_InvalidStringMultiplier,b,b,'Multiplication.combine string mult')};
      }
      let string = '';
      for (let i = 0; i < multiplier; i++) {
        string += base;
      }
      return {value:new StringValue(-1,b.line,string,'')};
    } else if (a.castableTo('num') && b.castableTo('nmtx')) {
      return {value:b.castTo('nmtx').scale(a.castTo('num'))};
    } else if (b.castableTo('num') && a.castableTo('nmtx')) {
      return {value:a.castTo('nmtx').scale(b.castTo('num'))};
    } else if ((a.castableTo('nvec') || a.castableTo('nmtx')) && (b.castableTo('nvec') || b.castableTo('nmtx'))) { //cvec*cmtx => cmtx, cvec*cvec above
      const A = a.castableTo('nvec')?Matrix.HorizontalVector(a.castTo('nvec').asNumberArray):a.castTo('nmtx').asNumericMatrix;
      if (A == null) {
        return {error:new CompilationError(ErrorName.Mult_NonRect,a,a,'Mult.operate cmtx*cvec')};
      }
      const B = b.castableTo('nvec')?Matrix.VerticalVector(b.castTo('nvec').asNumberArray):b.castTo('nmtx').asNumericMatrix;
      if (B == null) {
        return {error:new CompilationError(ErrorName.Mult_NonRect,b,b,'Mult.operate cvec*cmtx')};
      }
      const product = A.multiply(B);
      if (product == null) {
        return {error:new CompilationError(ErrorName.Mult_InvalidDimensions,[a,b],[a,b],'Mult.operate cvec*cmtx*cvec')}
      }
      return {value:NumberMatrix.FromNumericMatrix(product,this.line)};
    } else if (a.castableTo('meas') && b.castableTo('meas')) {
      const product = Measurement.multiply(a.castTo('meas'),b.castTo('meas'),1,a.line);
      if (product instanceof CompilationError) {
        return {error:product};
      }
      return {value:product};
    } else if (a.castableTo('meas') && b.castableTo('num')) {
      const product = Measurement.scale(a.castTo('meas'),b.castTo('num'),a.line);
      if (product instanceof CompilationError) {
        return {error:product};
      }
      return {value:product};
    } else if (b.castableTo('meas') && a.castableTo('num')) {
      const product = Measurement.scale(b.castTo('meas'),a.castTo('num'),a.line);
      if (product instanceof CompilationError) {
        return {error:product};
      }
      return {value:product};
    }
    return {error:new CompilationError(ErrorName.Mult_UnknownOperands,[a,b],[a,b],'Multiplication.combine')};
  }
  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[],warning?:CompilationWarning} {
    const index = arr.indexOf(this);
    const sliceStart = index - 1;
    const sliceEnd = index + 1;
    const operandA = arr[index - 1] as AbstractSymbol | undefined;
    const operandB = arr[index + 1] as AbstractSymbol | undefined;
    if (!Multiplication.validOperand(operandA)) {
      return new CompilationError(ErrorName.IllegalExpression,[operandA,this,operandB],[operandA],'Multiplication.operate - invalid a');
    }
    if (!Multiplication.validOperand(operandB)) {
      return new CompilationError(ErrorName.IllegalExpression,[operandA,this,operandB],[operandB],'Multiplication.operate - invalid b');
    }
    const resultSet = this.combine(operandA,operandB);
    if (resultSet.error) {
      return resultSet.error;
    }
    const result = resultSet.value;
    if (result == undefined) {
      return new CompilationError(ErrorName.IllegalExpression,[operandA,this,operandB],[operandA,this,operandB],'multiplcation result check');
    }
    result.consumeStart(operandA);
    result.consumeEnd(this);
    result.consumeEnd(operandB);
    return {
      list: [...arr.slice(0,sliceStart),result,...arr.slice(sliceEnd+1)],
      warning: resultSet.warning
    };
  }
}
class Division<V extends '/' | '%'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Multiplication);
  }

  private static validOperand(val: AbstractSymbol | undefined): val is NonVector | NumberVector | Measurement {
    return (val instanceof Alias) || (val instanceof Variable) || (val instanceof NumberValue) || (val instanceof NumberVector) || (val instanceof Measurement);
  }

  private combine(a: NonVector | NumberVector | Measurement,b: NumberValue | Measurement): NumberValue | Alias | NumberVector | Measurement | CompilationError {
    if (a.castableTo('num') && b.castableTo('num')) {
      return new NumberValue(-1,this.line,a.castTo('num').value / b.castTo('num').value,'');
    } else if (a.castableTo('alias') && b.castableTo('num')) {
      const A = a.castTo('alias');
      return A.scale(new NumberValue(-1,a.line,1/b.castTo('num').value,''));
    } else if (a.castableTo('nvec') && b.castableTo('num')) {
      return a.castTo('nvec').scale(new NumberValue(-1,this.line,1/b.castTo('num').value,''));
    } else if (a.castableTo('meas') && b.castableTo('meas')) {
      return Measurement.multiply(a.castTo('meas'),b.castTo('meas'),-1,a.line);
    } else if (a.castableTo('meas') && b.castableTo('num')) {
      return Measurement.scale(a.castTo('meas'),new NumberValue(-1,a.line,1/b.castTo('num').value,''),a.line);
    } else if (a.castableTo('num') && b.castableTo('meas')) {
      return Measurement.reciprocal(a.castTo('num'),b.castTo('meas'),a.line);
    }
    const reportList = [a,this.value=='/'?b:new WhatTheFuck(-1,this.line,'','')];
    return new CompilationError(ErrorName.Division_UnknownOperands,reportList,reportList,'Division.combine');
  }
  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[]} {
    const index = arr.indexOf(this);
    const sliceStart = index - 1;
    const sliceEnd = this.value=='/'?index+1:index;
    const operandA = arr[index - 1] as AbstractSymbol | undefined;
    const operandB = this.value=='/'?arr[index+1]:new NumberValue(-1,this.line,100,'') as AbstractSymbol | undefined;
    if (!Division.validOperand(operandA)) {
      return new CompilationError(ErrorName.Division_UnknownOperands,[operandA,this.value=='/'?operandB:undefined],operandA,'Division.operate - invalid a');
    }
    if (!(operandB instanceof StorableSymbol) || (!operandB.castableTo('num') && !operandB.castableTo('meas'))) {
      return new CompilationError(ErrorName.Division_UnknownOperands,[operandA,operandB],operandB,'Division.operate - invalid b');
    }
    if (operandB.castableTo('num') && operandB.castTo('num').value == 0) {
      return new CompilationError(ErrorName.Division_ByZero,[operandA,this,operandB],operandB,'Division.operator - b is zero');
    } else if (operandB.castableTo('meas') && operandB.castTo('meas').value.scalar == 0) {
      return new CompilationError(ErrorName.Division_ByZero,[operandA,this,operandB],operandB,'Division.operator - b is zero');
    }
    const result = this.combine(operandA,operandB.castableTo('num')?operandB.castTo('num'):operandB.castTo('meas'));
    if (result instanceof CompilationError) {
      return result;
    }
    result.consumeStart(operandA);
    result.consumeEnd(this);
    if (this.value == '/') {
      result.consumeEnd(operandB);
    }
    return {list:[...arr.slice(0,sliceStart),result,...arr.slice(sliceEnd+1)]};
  }
}
class Modulo<V extends 'mod'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Multiplication);
  }

  private static validOperand(val: AbstractSymbol | undefined): val is NumberValue | NumberVector {
    return (val instanceof NumberValue) || (val instanceof NumberVector);
  }

  private combine(a: NumberValue | NumberVector,b: NumberValue): {value?:NumberValue | NumberVector,error?:CompilationError,warning?:CompilationWarning} {
    function showWarning(a: NumberValue,b: NumberValue): boolean {
      return a.value < 0 || b.value < 0 && !(a.value < 0 && b.value < 0);
    }
    if (a.castableTo('num')) {
      return {
        value: new NumberValue(-1,this.line,a.castTo('num').value % b.value,''),
        warning: showWarning(a.castTo('num'),b)?new CompilationWarning(WarningName.Module_AmbiguousOperands,[a,this,b],[a,b],'Modulo.operate'):undefined
      };
    } else if (a.castableTo('nvec')) {
      let warning: CompilationWarning | undefined;
      const values: NumberValue[] = [];
      for (const val of a.castTo('nvec').value) {
        if (showWarning(val,b)) {
          warning ??= new CompilationWarning(WarningName.Module_AmbiguousOperands,[a,this,b],[a,b],'Modulo.operate');
        }
        values.push( new NumberValue(-1,a.line,val.value % b.value,'') );
      }
      return {value:new NumberVector(-1,a.line,values,''),warning:warning};
    }
    return {error:new CompilationError(ErrorName.Modulo_UnknownOperands,[a,b],[a,b],'Modulo.combine')};
  }
  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[],warning?:CompilationWarning} {
    const index = arr.indexOf(this);
    const sliceStart = index - 1;
    const sliceEnd = index+1;
    const operandA = arr[index - 1] as AbstractSymbol | undefined;
    const operandB = arr[index+1] as AbstractSymbol | undefined;
    if (!Modulo.validOperand(operandA)) {
      return new CompilationError(ErrorName.IllegalExpression,[operandA,this,operandB],operandA,'Modulo.operate - invalid a');
    }
    if (!(operandB instanceof StorableSymbol) || !operandB.castableTo('num')) {
      return new CompilationError(ErrorName.IllegalExpression,[operandA,this,operandB],operandB,'Modulo.operate - invalid b');
    }
    if (operandB.castTo('num').value == 0) {
      return new CompilationError(ErrorName.Modulo_ByZero,[operandA,this,operandB],operandB,'Modulo.operator - b is zero');
    }
    const result = this.combine(operandA,operandB.castTo('num'));
    if (result.error) {
      return result.error;
    }
    if (result.value == undefined) {
      return new CompilationError(ErrorName.Modulo_UnknownOperands,[operandA,operandB],[operandA,operandB],'Modulo.operate');
    }
    result.value.consumeStart(operandA);
    result.value.consumeEnd(this);
    result.value.consumeEnd(operandB);
    return {
      list: [...arr.slice(0,sliceStart),result.value,...arr.slice(sliceEnd+1)],
      warning: result.warning
    };
  }
}
class Exponent<V extends '^'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Exponent);
  }

  private static validOperand(val: AbstractSymbol | undefined): val is NumberValue | NumberVector | Measurement {
    return (val instanceof NumberValue) || (val instanceof NumberVector) || (val instanceof Measurement);
  }

  private combine(a: NumberValue | NumberVector | Measurement,b: NumberValue): {value?:NumberValue|NumberVector|Measurement,error?:CompilationError,warning?:CompilationWarning} {
    function showWarning(a: NumberValue): boolean {
      return a.value < 0 && a.consumedSymbols[0]?.value != '(';
    }
    if (a.castableTo('num')) {
      return {
        value: new NumberValue(-1,this.line,a.castTo('num').value ** b.value,''),
        warning: showWarning(a.castTo('num'))?new CompilationWarning(WarningName.Exponent_AmbiguousOperands,[a,b],[a,b],'Exponent.combine'):undefined
      };
    } else if (a.castableTo('nvec')) {
      const values: NumberValue[] = [];
      for (const val of a.castTo('nvec').value) {
        values.push( new NumberValue(-1,a.line,val.value ** b.value,'') );
      }
      return {value:new NumberVector(-1,a.line,values,'')};
    } else if (a.castableTo('meas')) {
      const raised = Measurement.raise(a.castTo('meas'),b,a.line);
      if (raised instanceof CompilationError) {
        return {error:raised};
      }
      return {value:raised};
    }
    return {
      error: new CompilationError(ErrorName.Exponent_UnknownOperands,[a,b],[a,b],'Exponent.combine')
    };
  }
  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[],warning?:CompilationWarning} {
    const index = arr.indexOf(this);
    const sliceStart = index - 1;
    const sliceEnd = index+1;
    const operandA = arr[index - 1] as AbstractSymbol | undefined;
    const operandB = arr[index+1] as AbstractSymbol | undefined;
    if (!Exponent.validOperand(operandA)) {
      return new CompilationError(ErrorName.Exponent_UnknownOperands,[operandA,this,operandB],operandA,'Exponent.operate - invalid a');
    }
    if (!(operandB instanceof StorableSymbol) || !operandB.castableTo('num')) {
      return new CompilationError(ErrorName.Exponent_UnknownOperands,[operandA,this,operandB],operandB,'Exponent.operate - invalid b');
    }
    const result = this.combine(operandA,operandB.castTo('num'));
    if (result.error) {
      return result.error;
    }
    if (result.value == undefined) {
      return new CompilationError(ErrorName.Exponent_UnknownOperands,[operandA,operandB],[operandA,operandB],'Exponent.operate');
    }
    result.value.consumeStart(operandA);
    result.value.consumeEnd(this);
    result.value.consumeEnd(operandB);
    return {
      list: [...arr.slice(0,sliceStart),result.value,...arr.slice(sliceEnd+1)],
      warning: result.warning
    };
  }
}
class Factorial<V extends '!'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Exponent);
  }

  private static validOperand(val: AbstractSymbol | undefined): val is NumberValue | NumberVector {
    return (val instanceof NumberValue) || (val instanceof NumberVector);
  }

  private combine(a: NumberValue | NumberVector): NumberValue | NumberVector | CompilationError {
    if (a.castableTo('num')) {
      const fact = SuperMath.factorial(a.castTo('num').value);
      if (fact instanceof Error) {
        return new CompilationError(ErrorName.Factorial_NegativeInteger,[a,this],a,'Factorial.combine');
      }
      return new NumberValue(-1,this.line,fact,'');
    } else if (a.castableTo('nvec')) {
      const values: NumberValue[] = [];
      for (const val of a.castTo('nvec').value) {
        const fact = SuperMath.factorial(val.value);
        if (fact instanceof Error) {
          return new CompilationError(ErrorName.Factorial_NegativeInteger,[a,this],a,'Factorial.combine');
        }
        values.push( new NumberValue(-1,a.line,fact,'') );
      }
      return new NumberVector(-1,a.line,values,'');
    }
    return new CompilationError(ErrorName.Factorial_UnknownOperands,a,a,'');
  }
  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[]} {
    const index = arr.indexOf(this);
    const sliceStart = index - 1;
    const sliceEnd = index;
    const operandA = arr[index - 1] as AbstractSymbol | undefined;
    if (!Factorial.validOperand(operandA)) {
      return new CompilationError(ErrorName.IllegalExpression,[operandA,this],operandA,'Factorial.operate - invalid a');
    }
    const result = this.combine(operandA);
    if (result instanceof CompilationError) {
      return result;
    }
    result.consumeStart(operandA);
    result.consumeEnd(this);
    return {list:[...arr.slice(0,sliceStart),result,...arr.slice(sliceEnd+1)],};
  }
}
class Equality<V extends '='|'<'|'>'|'<='|'>='> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Addition);
  }

  public operate(arr: AbstractSymbol[]): {list:AbstractSymbol[]} | CompilationError {
    if (this.value == '=') {
      return new CompilationError(ErrorName.Comparison_SingleEqualsSign,this,this,'Equality.operate =');
    }
    const index = arr.indexOf(this);
    const A = arr[index-1];
    const B = arr[index+1];
    if (!(A instanceof StorableSymbol)) {
      return new CompilationError(ErrorName.Comparison_MissingLeftOperand,this,this,'Equality.operate left');
    }
    if (!(B instanceof StorableSymbol)) {
      return new CompilationError(ErrorName.Comparison_MissingRightOperand,this,this,'Equality.operate right');
    }
    let boolResult: boolean;
    if (A.castableTo('num') && B.castableTo('num')) {
      boolResult = A.castTo('num').compare(B.castTo('num'),this.value);
    } else if (A.castableTo('str') && B.castableTo('str')) {
      boolResult = A.castTo('str').compare(B.castTo('str'),this.value);
    } else if (A.castableTo('date') && B.castableTo('date')) {
      boolResult = A.castTo('date').compare(B.castTo('date'),this.value);
    } else {
      return new CompilationError(ErrorName.Comparison_InvalidTypes,[A,this,B],[A,B],'Equality.operate type check');
    }
    const result = new BooleanValue(-1,this.line,boolResult,'');
    result.consumeEnd(A);
    result.consumeEnd(this);
    result.consumeEnd(B);
    return {list:[...arr.slice(0,index-1),result,...arr.slice(index+2)]};
  }
}
class Comparison<V extends '=='|'~='|'==='|'~=='> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Comparison);
  }

  public operate(arr: AbstractSymbol[]): {list:AbstractSymbol[],warning?:CompilationWarning} | CompilationError {
    const index = arr.indexOf(this);
    const A = arr[index-1];
    const B = arr[index+1];
    if (!(A instanceof StorableSymbol)) {
      return new CompilationError(ErrorName.Comparison_MissingLeftOperand,this,this,'Comparison.operate left');
    }
    if (!(B instanceof StorableSymbol)) {
      return new CompilationError(ErrorName.Comparison_MissingRightOperand,this,this,'Comparison.operate right');
    }
    let boolResult = A.equals(B,undefined,this.value=='==='||this.value=='~==');
    if (this.value == '~=' || this.value == '~==') {
      boolResult = !boolResult;
    }
    const result = new BooleanValue(-1,this.line,boolResult,'');
    result.consumeEnd(A);
    result.consumeEnd(this);
    result.consumeEnd(B);
    return {
      list: [...arr.slice(0,index-1),result,...arr.slice(index+2)],
      warning: A.type==B.type||A.type=='none'||B.type=='none'?undefined:new CompilationWarning(WarningName.Comparison_DifferingTypes,[A,this,B],[A,B],'Comparison.operate type check')
    };
  }
}
class Comma<V extends ','> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Colon);
  }

  public operate(arr: AbstractSymbol[]): {list:AbstractSymbol[]} {
    return {list:arr};
  }
}
class Colon<V extends ':'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Colon);
  }

  public operate(arr: AbstractSymbol[]): {list:AbstractSymbol[]} {
    return {list:arr};
  }
}
class QuestionMark<V extends '?'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.IfElse);
  }

  public operate(arr: AbstractSymbol[]): {list:AbstractSymbol[]} {
    return {list:arr};
  }
}
class ForEach<V extends 'addeach' | 'subeach' | 'multeach' | 'diveach'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,
      (value=='multeach'||value=='diveach') ? OperatorPriority.PointwiseMultiplication : OperatorPriority.PointwiseAddition
    );
  }

  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[],warning?:CompilationWarning} {
    const index = arr.indexOf(this);
    const xValue = arr[index-1];
    const yValue = arr[index+1];
    if (!(xValue instanceof GenericVector) || !(yValue instanceof GenericVector)) {
      return new CompilationError(ErrorName.Each_VectorTypeMismatch,[xValue,yValue],[xValue,yValue],'ForEach.operate() type check');
    }
    let result: NumberVector | NumberMatrix | CompilationError;
    let warning: CompilationWarning | undefined;
    if (xValue.castableTo('nvec') && yValue.castableTo('nvec')) {
      if (xValue.size != yValue.size) {
        return new CompilationError(ErrorName.Each_VectorSizeMismatch,[xValue,this],[xValue],'ForEach.operate() vector nonzero size check');
      }
      const rawResult = xValue.castTo('nvec').each(yValue.castTo('nvec'),this.value);
      if (rawResult instanceof CompilationError) {
        result = rawResult;
      } else {
        result = rawResult.vector;
        warning ??= rawResult.warning;
      }
    } else if (xValue.castableTo('nmtx') && yValue.castableTo('nmtx')) {
      const xMatrix = xValue.castTo('nmtx');
      const yMatrix = yValue.castTo('nmtx');
      if (!xMatrix.sameDimensionsAs(yMatrix)) {
        return new CompilationError(ErrorName.Each_MatrixDimensionMismatch,[xMatrix,yMatrix],[xMatrix,yMatrix],'ForEach.operate() dimension check');
      }
      const innerValue: NumberVector[] = [];
      for (let i = 0; i < xMatrix.value.length; i++) {
        const rawResult = xMatrix.value[i].each(yMatrix.value[i],this.value);
        if (rawResult instanceof CompilationError) {
          return rawResult;
        }
        innerValue.push(rawResult.vector);
        warning ??= rawResult.warning;
      }
      result = new NumberMatrix(-1,this.line,innerValue,'');
    } else {
      return new CompilationError(ErrorName.Each_VectorTypeMismatch,[xValue,yValue],[xValue,yValue],'ForEach.operate() type check');
    }
    if (result instanceof CompilationError) {
      return result;
    }
    result.consumeEnd(xValue);
    result.consumeEnd(this);
    result.consumeEnd(yValue);
    return {list:[
      ...arr.slice(0,index-1),
      result,
      ...arr.slice(index+2)
    ],warning};
  }
}
class Transpose<V extends "'"> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.Multiplication);
  }

  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[];warning?:CompilationWarning;} {
    const index = arr.indexOf(this);
    const matrix = arr[index-1];
    if (!(matrix instanceof StorableMatrix)) {
      return new CompilationError(ErrorName.Transpose_NonMatrixType,matrix,matrix,'Transpose.operate matrix check');
    }
    const componentVectors: (NumberVector|VariableVector)[] = [];
    for (let c = 0; c < matrix.maxColCount; c++) {
      const columnValues: (NumberValue|Variable|undefined)[] = [];
      for (let r = 0; r < matrix.rowCount; r++) {
        columnValues.push((matrix.value[r] as AbstractVector).value[c] as NumberValue);
      }
      const indexOfFirstUndefined = columnValues.findIndex(e => e == undefined);
      const indexOfLastValue = columnValues.findIndex(e => e != undefined);
      if (indexOfFirstUndefined == -1 || indexOfFirstUndefined > indexOfLastValue) {
        const innerVector = GenericVector.FromArray(columnValues.filter(e => e != undefined) as AbstractSymbol[],this.line);
        if (innerVector instanceof CompilationError) {
          return innerVector;
        }
        componentVectors.push(innerVector as NumberVector);
      } else {
        return new CompilationError(ErrorName.Transpose_MalFormedMatrix,matrix,matrix,'Transpose.operate inner undefined check');
      }
    }
    const transposedMatrix = GenericVector.FromArray(componentVectors,this.line);
    if (transposedMatrix instanceof CompilationError) {
      return transposedMatrix;
    }
    transposedMatrix.consumeEnd(matrix);
    transposedMatrix.consumeEnd(this);
    return {
      list: [...arr.slice(0,index-1),transposedMatrix,...arr.slice(index+1)],
      warning: matrix.isRectangular?undefined:new CompilationWarning(WarningName.Transpose_NonRectangularMatrix,matrix,matrix,'Transpose.operate')
    };
  }
}
class BinaryNot<V extends '~'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.BinaryNot);
  }

  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[]} {
    const index = arr.indexOf(this);
    const bool = arr[index+1];
    if (!(bool instanceof StorableSymbol) || !bool.castTo('bool')) {
      return new CompilationError(ErrorName.Not_NonBoolean,bool,bool,'BinaryNot.operate non bool');
    }
    const result = new BooleanValue(-1,this.line,!bool.castTo('bool').value,'');
    result.consumeEnd(this);
    result.consumeEnd(bool);
    return {list:[...arr.slice(0,index),result,...arr.slice(index+2)]};
  }
}
type AbstractBinary = BinaryAndOr<'&' | '|' | 'xor' | 'nor'>;
class BinaryAndOr<V extends '&' | '|' | 'xor' | 'nor'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.BinaryAndOr);
  }

  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[]} {
    const index = arr.indexOf(this);
    const rawA = arr[index-1];
    const rawB = arr[index+1];
    if (!(rawA instanceof StorableSymbol) || !rawA.castableTo('bool')) {
      return new CompilationError(ErrorName.AndOr_NonBoolean,rawA,rawA,'BinaryAndOr.operate non bool a');
    }
    if (!(rawB instanceof StorableSymbol) || !rawB.castableTo('bool')) {
      return new CompilationError(ErrorName.AndOr_NonBoolean,rawB,rawB,'BinaryAndOr.operate non bool b');
    }
    const boolA = rawA.castTo('bool');
    const boolB = rawB.castTo('bool');
    let boolResult: boolean;
    if (this.value == '&') {
      boolResult = boolA.value && boolB.value;
    } else if (this.value == '|') {
      boolResult = boolA.value || boolB.value;
    } else if (this.value == 'xor') { //xor
      boolResult = boolA.value != boolB.value;
    } else { //nor
      boolResult = !boolA.value && !boolB.value;
    }
    const result = new BooleanValue(-1,this.line,boolResult,'');
    result.consumeEnd(boolA);
    result.consumeEnd(this);
    result.consumeEnd(boolB);
    return {list:[...arr.slice(0,index-1),result,...arr.slice(index+2)]};
  }
}
type AbstractIfThen = IfThen<'<=>'|'=>'>;
class IfThen<V extends '=>' | '<=>'> extends Operator<V> {
  public constructor(index: number,line: CodeLine,value: V) {
    super(index,line,value,OperatorPriority.IfThen);
  }

  public operate(arr: AbstractSymbol[]): CompilationError | {list:AbstractSymbol[]} {
    return new CompilationError(ErrorName.IllegalExpression,this,this,'IfThen.operate');
  }
}

// ~ FUNCTIONS ~

interface IFunctionInput {
  readonly name?: string;
  readonly symbol?: AbstractSymbol;
}
type FunctionParam = {
  readonly name: string;
  readonly desc: string;
  readonly types: ReadonlyArray<SymbolType>;
  readonly default?: string;
} & ({readonly optional?:false} | {readonly optional:true,readonly default:string});
interface IFunctionReturn {
  readonly type: SymbolType;
  readonly desc?: string;
}
interface IFunctionNamedParam {
  readonly map: Readonly<Record<string,AbstractSymbol>>;
  readonly warnings?: CompilationWarning[];
}
type FunctionResult = CompilationError | {
  value: AbstractStorable;
  warnings: CompilationWarning[] | undefined;
  recommendations?: CompilationRecommendation[];
}
abstract class BuiltInFunction extends KeyableSymbol<undefined> {
  protected readonly params: FlexArray<FunctionParam>;
  private readonly returnTypes: ReadonlyArray<IFunctionReturn>;
  private readonly desc: string;

  public constructor(index: number,line: CodeLine,name: string,desc: string,params: FlexArray<FunctionParam>,returnType: FlexArray<IFunctionReturn>) {
    super(index,line,undefined,name,'func');
    this.params = params;
    this.returnTypes = returnType;
    this.desc = desc;
  }
  public clone(index: number,text?: string,line?: CodeLine): BuiltInFunction {
    return BuiltInFunction.Build(index,line ?? this.line,text ?? this.text) as BuiltInFunction;
  }

  public static Build(index: number,line: CodeLine,value: string): BuiltInFunction | ProxySymbol {
    if (Object.keys(Summarizer.descriptions).includes(value)) {
      return new Summarizer(index,line,value);
    }
    if (Object.keys(MathOperation.descriptions).includes(value)) {
      return new MathOperation(index,line,value);
    }
    if (Object.keys(Normalizer.descriptions).includes(value)) {
      return new Normalizer(index,line,value);
    }
    if (Object.keys(MatrixSize.descriptions).includes(value)) {
      return new MatrixSize(index,line,value);
    }
    switch(value) {
      case 'range':
        return new VectorRange(index,line);
      case 'size':
        return new VectorSize(index,line);
      case 'sort':
        return new VectorSorter(index,line);
      case 'deter': case 'trace':
        return new TraceDeterminate(index,line,value);
      case 'split':
        return new Split(index,line);
      case 'join':
        return new Join(index,line);
      case 'lsr':
        return new LeastSquaresRegression(index,line);
      case 'rsq':
        return new RSquared(index,line);
      case 'identity':
        return new Identity(index,line);
      case 'inv':
        return new Inverse(index,line);
      case 'diag':
        return new Diagonal(index,line);
      case 'convert':
        return new MeasurementConverter(index,line);
      case 'unique':
        return new Unique(index,line);
      case 'union':
        return new Union(index,line);
      //inators
      case 'date':
        return new DateInator(index,line);
      case 'ntwk':
        return new NetworkInator(index,line);
      case 'edge':
        return new NetworkEdgeInator(index,line);
      case 'node':
        return new NetworkNodeInator(index,line);
      case 'source':
        return new NetworkSourceInator(index,line);
      case 'sink':
        return new NetworkSinkInator(index,line);
      case 'meas':
        return new MeasurementInator(index,line);
      case 'nmtx': case 'vmtx':
        return new MatrixInator(index,line,value);
      case 'offset':
        return new OffsetInator(index,line);
      case 'model':
        return new LPModelInator(index,line);
      case 'plot':
        return new PlotInator(index,line);
      //stats
      case 'ztest': case 'ttest':
        return new OneSampleStatTest(index,line,value);
      case 'ztest2': case 'ttest2':
        return new TwoSampleStatTest(index,line,value);
      case 'pttest': case 'pztest':
        return new PairedStatTest(index,line,value);
      case 'propztest': case 'propztest2':
        return new PropStatTest(index,line,value);
      case 'goftest':
        return new GoodnessOfFitTest(index,line);
      case 'indtest':
        return new IndependenceTest(index,line);
      case 'ftest':
        return new FStatTest(index,line);
      case 'anova':
        return new ANOVA(index,line);
    }
    return new ProxySymbol(index,line,value);
  }
  public static parseParameters(values: IFunctionInput[],params: FlexArray<FunctionParam>,text: string): IFunctionNamedParam | CompilationError {
    const paramNames = params.map(e => e.name);
    if (values.length > paramNames.length) { //too many parameters
      return new CompilationError(
        ErrorName.Function_TooManyParams,
        values.map(e => e.symbol),
        [new NumberValue(-1,CodeLine.Unlinked(),values.length,''),new NumberValue(-1,CodeLine.Unlinked(),params.length,'')],
        'CustomFunction.mapParameters'
      );
    }
    const map: Record<string,AbstractSymbol> = {};
    const warnings: CompilationWarning[] = [];
    let unnamedParameters = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i].symbol == undefined) {
        continue;
      }
      const paramName = values[i].name ?? paramNames[unnamedParameters];
      if (values[i].name == undefined) {
        unnamedParameters++;
      }
      const paramIndex = params.findIndex(e => e.name == paramName);
      if (paramIndex == -1) {
        continue;
      }
      if (paramName in map) {
        warnings.push(new CompilationWarning(WarningName.Function_DuplicateParameter,values[i].symbol,paramName,'CustomFunction.mapParameters duplicate check'));
      } else if (params[paramIndex].types.includes(values[i].symbol!.type)) {
        map[paramName] = values[i].symbol!;
      } else {
        let castFound = false;
        for (const type of params[paramIndex].types) {
          if (values[i].symbol!.castableTo(type as StorableSymbolType)) {
            map[paramName] = values[i].symbol!.castTo(type as StorableSymbolType);
            castFound = true;
            break;
          }
        }
        if (!castFound) {
          return new CompilationError(
            ErrorName.Blank,
            values.map(e => e.symbol),
            `Value of type ${values[i].symbol?.type} is not assignable to ${params[paramIndex].types.join('|')} for parameter "${paramName}" in ${text}`,
            'BuiltInFunction.mapParameters'
          );
        }
      }
    }
    for (const paramSet of params) {
      if (!paramSet.optional && !(paramSet.name in map)) { //missing required parameter
        return new CompilationError(ErrorName.Fxn_MissingRequiredParam,values.map(e => e.symbol),paramSet.name,'BuiltInFunction.mapParameters');
      }
    }
    return {map,warnings};
  }

  protected mapParameters(values: IFunctionInput[]): IFunctionNamedParam | CompilationError {
    // const paramNames = this.params.map(e => e.name);
    // if (values.length > paramNames.length) { //too many parameters
    //   return new CompilationError(
    //     ErrorName.Function_TooManyParams,
    //     values.map(e => e.symbol),
    //     [new Constant(-1,CodeLine.Unlinked(),values.length,''),new Constant(-1,CodeLine.Unlinked(),this.params.length,'')],
    //     'CustomFunction.mapParameters'
    //   );
    // }
    // const map: Record<string,AbstractSymbol> = {};
    // const warnings: CompilationWarning[] = [];
    // let unnamedParameters = 0;
    // for (let i = 0; i < values.length; i++) {
    //   if (values[i].symbol == undefined) {
    //     continue;
    //   }
    //   const paramName = values[i].name ?? paramNames[unnamedParameters];
    //   if (values[i].name == undefined) {
    //     unnamedParameters++;
    //   }
    //   const paramIndex = this.params.findIndex(e => e.name == paramName);
    //   if (paramIndex == -1) {
    //     continue;
    //   }
    //   if (paramName in map) {
    //     warnings.push(new CompilationWarning(WarningName.Function_DuplicateParameter,values[i].symbol,paramName,'CustomFunction.mapParameters duplicate check'));
    //   } else if (this.params[paramIndex].types.includes(values[i].symbol!.type)) {
    //     map[paramName] = values[i].symbol!;
    //   } else {
    //     let castFound = false;
    //     for (const type of this.params[paramIndex].types) {
    //       if (values[i].symbol!.castableTo(type as StorableSymbolType)) {
    //         map[paramName] = values[i].symbol!.castTo(type as StorableSymbolType);
    //         castFound = true;
    //         break;
    //       }
    //     }
    //     if (!castFound) {
    //       return new CompilationError(
    //         ErrorName.Blank,
    //         values.map(e => e.symbol),
    //         `Value of type ${values[i].symbol?.type} is not assignable to ${this.params[paramIndex].types.join('|')} for parameter "${paramName}" in ${this.text}()`,
    //         'BuiltInFunction.mapParameters'
    //       );
    //     }
    //   }
    // }
    // for (const paramSet of this.params) {
    //   if (!paramSet.optional && !(paramSet.name in map)) { //missing required parameter
    //     return new CompilationError(ErrorName.Fxn_MissingRequiredParam,values.map(e => e.symbol),paramSet.name,'BuiltInFunction.mapParameters');
    //   }
    // }
    // return {map,warnings};
    return BuiltInFunction.parseParameters(values,this.params,this.text + '()');
  }
  
  get maxParamCount(): number { return this.params.length; }
  get minParamcount(): number { return this.params.filter(e => !e.optional).length; }

  get propertyNames(): (string|undefined)[] | undefined { return undefined; }
  get paramValues(): {name:string;values:ReadonlyArray<SymbolType>;}[] {
    return this.paramValues.map(e => { return {name:e.name,values:e.values}; });
  }
  public getNamedProperty(index: AbstractSymbol): AbstractStorable | CompilationError {
    return new CompilationError(ErrorName.SIndex_NoneFound,index,index,'BIF.getNamedProperty');
  }
  public equals(other: AbstractSymbol): boolean {
    return this.name == other.name && other.type == this.type;
  }
  public rename(): StorableSymbol<undefined> {
    throw new Error('Cannot rename function');
  }

  get preview(): string {
    let base = this.text + '() &#45; ' + this.desc + '&#10;&#10;';
    for (let i = 0; i < this.params.length; i++) {
      const P = this.params[i];
      base += `@param ${P.name}${P.optional?'?':''}${P.default?` {default=${P.default}}`:''} <${P.types.join('|')}> &#45; ${P.desc}&#10;`;
    }
    if (this.params.length == 0) {
      base += '<no parameters>&#10;';
    }
    for (let i = 0; i < this.returnTypes.length; i++) {
      base += `&#10;@returns {${this.returnTypes[i].type}}${this.returnTypes[i].desc?' &#45; '+this.returnTypes[i]:''}`;
    }
    return base;
  }
  get signature(): string {
    return `(${this.params.map(e => `${e.name}${e.optional?'?':''}:${e.types.join('|')}`).join(',')})=>${this.returnTypes.map(e => e.type).join('|')}`;
  }

  public abstract operate(values: IFunctionInput[]): FunctionResult;
  public matchesParamAtIndex(i: number,value: AbstractSymbol): boolean {
    return this.params[i]?.types.includes(value.type);
  }
}
class MathOperation extends BuiltInFunction {
  public static readonly descriptions: Readonly<Record<string,string>> = {
    'sign': 'sign',
    'log': 'natural logarithm',
    'log2': 'base-2 logarithm',
    'log10': 'base-10 logarithm',
    'exp': 'exponential (e^x)',
    'abs': 'absolute value',
    'round': 'rounded value',
    'ceil': 'ceiling',
    'floor': 'floor',
    'sqrt': 'square root',
    'cbrt': 'cube root',
    'cos': 'cosine',
    'acos': 'arc-cosine',
    'sin': 'sine',
    'asin': 'arc-sine',
    'tan': 'tangent',
    'atan': 'arc-tangent',
  };

  public constructor(index: number,line: CodeLine,name: string) {
    super(index,line,name,'Takes the %v of a numerical type'.replace('%v',MathOperation.descriptions[name] ?? ''),[
      {name:'x',types:['num','nvec','nmtx'],desc:'The value of which to take the %v'.replace('%v',MathOperation.descriptions[name] ?? '')}
    ],[
      {type:'num'},{type:'nvec'},{type:'nmtx'}
    ]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    if (!('x' in params.map)) {
      return new CompilationError(ErrorName.Function_MissingParameter,values.map(e => e.symbol),'x','BasicOperation.operate pass check');
    }
    const X = params.map.x;
    if (!(X instanceof StorableSymbol)) {
      return new CompilationError(ErrorName.BasicOperation_NonNumerical,params.map.x,params.map.x,'BasicOperation.operate fallback');
    }
    if (X.castableTo('num') || X.castableTo('nvec') || X.castableTo('nmtx')) {
      let fxn: ((e:number,i:number) => number) | undefined;
      switch(this.text) {
        case 'sign': fxn = Math.sign; break;
        case 'log': fxn = Math.log; break;
        case 'log2': fxn = Math.log2; break;
        case 'log10': fxn = Math.log10; break;
        case 'exp': fxn = Math.exp; break;
        case 'abs': fxn = Math.abs; break;
        case 'round': fxn = Math.round; break;
        case 'ceil': fxn = Math.ceil; break;
        case 'floor': fxn = Math.floor; break;
        case 'sqrt': fxn = Math.sqrt; break;
        case 'cbrt': fxn = Math.cbrt; break;
        case 'cos': fxn = Math.cos; break;
        case 'sin': fxn = Math.sin; break;
        case 'tan': fxn = Math.tan; break;
        case 'acos': fxn = Math.acos; break;
        case 'asin': fxn = Math.asin; break;
        case 'atan': fxn = Math.atan; break;
      }
      if (fxn == undefined) {
        return new CompilationError(ErrorName.IllegalExpression,values.map(e => e.symbol),values.map(e => e.symbol),'BasicOperation.operate missing map fxn');
      }
      const result = (X.castableTo('num')?X.castTo('num'):(X.castableTo('nvec')?X.castTo('nvec'):X.castTo('nmtx'))).map(fxn);
      if (result instanceof CompilationError) {
        return result;
      }
      return {value:result,warnings:params.warnings};
    } else {
      return new CompilationError(ErrorName.BasicOperation_NonNumerical,params.map.x,params.map.x,'BasicOperation.operate fallback');
    }
  }
}
class VectorRange extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'range','Returns an array with a given start, end, and step',[
      {name:'start',types:['num'],desc:'The value at which to start the range',optional:true,default:'1'},
      {name:'end',types:['num'],desc:'The value at which to end the range (can be included in final range)'},
      {name:'step',types:['num'],desc:'The step value - cannot be 0',optional:true,default:'1'},
    ],[{type:'nvec'}]);
  }

  private singleValueRange(x: number,sym?: NumberValue,warnList?: CompilationWarning[]): FunctionResult {
    const vectorValues: NumberValue[] = [];
    if (x > 0) {
      for (let i = 1; i <= x; i++) {
        vectorValues.push(new NumberValue(-1,this.line,i,''));
      }
    } else if (x < 0) {
      for (let i = x; i <= -1; i++) {
        vectorValues.push(new NumberValue(-1,this.line,i,''));
      }
    } else {
      return new CompilationError(ErrorName.Range_ZeroEnd,sym,sym,'VectorRange.singleValueRange range(0)');
    }
    return {value:new NumberVector(-1,this.line,vectorValues,''),warnings:warnList};
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    if (values.length == 1 && (values[0].name == undefined || values[0].name == 'end')) {
      if (values[0].symbol instanceof StorableSymbol && values[0].symbol.castableTo('num')) {
        return this.singleValueRange(values[0].symbol.value,values[0].symbol.castTo('num'));
      } else {
        return new CompilationError(ErrorName.Range_NonConstant,values[0].symbol,values[0].symbol,'VectorRange.operate end override check');
      }
    }
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    if (!('end' in params.map)) {
      return new CompilationError(ErrorName.Range_MissingEnd,values.map(e => e.symbol),values.map(e => e.symbol),'VectorRange.operate end check');
    }
    if (!(params.map.end instanceof StorableSymbol) || !params.map.end.castableTo('num')) {
      return new CompilationError(ErrorName.Range_NonConstant,params.map.end,params.map.end,'VectorRange.operate const check');
    }
    const range: IVectorRange = {to:params.map.end.value};
    if ('start' in params.map) {
      if (params.map.start instanceof StorableSymbol && params.map.start.castableTo('num')) {
        range.from = params.map.start.value;
      } else {
        return new CompilationError(ErrorName.Range_NonConstant,params.map.start,params.map.start,'VectorRange.operate const check');
      }
    } else {
      range.from = 1;
    }
    if ('step' in params.map) {
      if (params.map.step instanceof StorableSymbol && params.map.step.castableTo('num')) {
        range.step = params.map.step.value;
      } else {
        return new CompilationError(ErrorName.Range_NonConstant,params.map.step,params.map.step,'VectorRange.operate const check');
      }
    } else {
      range.step = 1;
    }
    if (range.from == Infinity || range.from == -Infinity) {
      return new CompilationError(ErrorName.Range_Infinity,params.map.start,params.map.start,'VectorRange.operate inf start');
    }
    if (range.to == Infinity || range.to == -Infinity) {
      return new CompilationError(ErrorName.Range_Infinity,params.map.end,params.map.end,'VectorRange.operate inf end');
    }
    if (range.step == Infinity || range.step == -Infinity) {
      return new CompilationError(ErrorName.Range_Infinity,params.map.step,params.map.step,'VectorRange.operate inf step');
    }
    if (range.from != undefined && range.step != undefined && range.to == range.from && range.step == range.step) {
      return this.singleValueRange(range.to,undefined,params.warnings);
    }
    const numberList = NumberVector.buildRange(range,values.map(e => e.symbol));
    if (numberList instanceof CompilationError) {
      return numberList;
    }
    const vectorValues: NumberValue[] = [];
    for (const i of numberList) {
      vectorValues.push(new NumberValue(-1,this.line,i,''));
    }
    return {value:new NumberVector(-1,this.line,vectorValues,''),warnings:params.warnings};
  }
}
class Summarizer extends BuiltInFunction {
  public static readonly descriptions: Readonly<Record<string,string>> = {
    'mean': 'mean',
    'popvar': 'population variance',
    'samvar': 'sample variance',
    'popsd': 'population standard deviation',
    'samsd': 'sample standard deviation',
    'median': 'median',
    'mode': 'mode',
    'sum': 'sum',
    'max': 'maximum',
    'min': 'minimum'
  } as const;

  public constructor(index: number,line: CodeLine,name: keyof typeof Summarizer.descriptions) {
    super(index,line,name,'Takes the %v of a constant vector'.replace('%v',Summarizer.descriptions[name] ?? ''),[
      {name:'v',types:['nvec'],desc:'The vector of which to take the %v'.replace('%v',Summarizer.descriptions[name] ?? '')},
    ],[{type:'num'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    if (!('v' in params.map)) {
      return new CompilationError(ErrorName.Summarizer_MissingVector,values.map(e => e.symbol),values.map(e => e.symbol),'Summarizer.operate v check');
    }
    if (!(params.map.v instanceof GenericVector) || !params.map.v.castableTo('nvec')) {
      return new CompilationError(ErrorName.Summarizer_NonConstantVector,values.map(e => e.symbol),values.map(e => e.symbol),'Summarizer.operate cvec check');
    }
    const vector = params.map.v.castTo('nvec');
    if (params.map.v.size == 0) {
      return new CompilationError(ErrorName.Summarizer_SizeZero,values.map(e => e.symbol),values.map(e => e.symbol),'Summarizer.operate cvec check');
    }
    let result: number | undefined;
    switch (this.text) {
      case 'sum': result = SuperMath.sum(vector.asNumberArray); break;
      case 'mean': result = SuperMath.mean(vector.asNumberArray); break;
      case 'median': result = SuperMath.median(vector.asNumberArray); break;
      case 'mode': result = SuperMath.mode(vector.asNumberArray); break;
      case 'samvar': result = SuperMath.sampleVariance(vector.asNumberArray); break;
      case 'samsd': result = SuperMath.sampleStd(vector.asNumberArray); break;
      case 'popvar': result = SuperMath.populationVariance(vector.asNumberArray); break;
      case 'popsd': result = SuperMath.populationStd(vector.asNumberArray); break;
      case 'max': result = Math.max.apply(null,vector.asNumberArray); break;
      case 'min': result = Math.min.apply(null,vector.asNumberArray); break;
    }
    if (result == undefined) {
      return new CompilationError(ErrorName.IllegalExpression,values.map(e => e.symbol),values.map(e => e.symbol),'Summarizer.operate cvec check');
    }
    return {value:new NumberValue(-1,this.line,result,''),warnings:params.warnings};
  }
}
class VectorSize extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'size','Finds the size of a vector or string',[
      {name:'x',types:['str','list'],desc:'The vector or string of which to find the size'},
    ],[{type:'num'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    if (!('x' in params.map)) {
      return new CompilationError(ErrorName.Fxn_MissingRequiredParam,values.map(e => e.symbol),'x','VectorSize.operate');
    }
    if (params.map.x instanceof GenericVector) {
      return {value:new NumberValue(-1,this.line,params.map.x.size,''),warnings:params.warnings};
    } else if (params.map.x instanceof StorableSymbol && params.map.x.castableTo('str')) {
      return {value:new NumberValue(-1,this.line,params.map.x.castTo('str').size,''),warnings:params.warnings};
    } else {
      return new CompilationError(ErrorName.Size_VectorTypeMismatch,values.map(e => e.symbol),values.map(e => e.symbol),'VectorSize.operate nonvec');
    }
  }
}
class MatrixSize extends BuiltInFunction {
  public static readonly descriptions: Readonly<Record<string,string>> = {
    'nrow': 'Finds the number of rows in a matrix',
    'ncol': 'Finds the number of column in a rectangular matrix',
    'maxcol': 'Finds the length of the longest row in the matrix',
    'mincol': 'Finds the length of the shortest row in the matrix',
  } as const;

  public constructor(index: number,line: CodeLine,value: keyof typeof MatrixSize.descriptions) {
    super(index,line,value,MatrixSize.descriptions[value],[
      {name:'x',types:['nmtx','vmtx'],desc:'The matrix of which to find the size'},
    ],[{type:'num'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const matrix = params.map.x.castableTo('nmtx') ? params.map.x.castTo('nmtx') : params.map.x.castTo('vmtx');
    let result: number;
    if (this.text == 'nrow') {
      result = matrix.size;
    } else if (this.text == 'ncol') {
      if (!matrix.isRectangular) {
        return new CompilationError(ErrorName.NCol_NonRect,params.map.x,params.map.x,'MatrixSize.operate ncol nonrect');
      }
      result = matrix.maxColCount;
    } else if (this.text == 'maxcol') {
      result = matrix.maxColCount;
    } else if (this.text == 'mincol') {
      result = matrix.minColCount;
    } else {
      return new CompilationError(ErrorName.IllegalExpression,params.map.x,params.map.x,'MatrixSize.operate wtf');
    }
    return {value:new NumberValue(-1,this.line,result,''),warnings:params.warnings};
  }
}
class Normalizer extends BuiltInFunction {
  public static readonly descriptions: Readonly<Record<string,string>> = {
    'unit': 'Normalizes a vector to a magnitude of 1',
    'prob': 'Converts a vector to a probability distribution',
    'norm': 'Standardizes a vector to a mean of 0 and a standard deviation of 1',
  };

  public constructor(index: number,line: CodeLine,name: string) {
    super(index,line,name,Normalizer.descriptions[name] ?? '',[
      {name:'v',types:['nvec'],desc:'The vector to normalize'},
    ],[{type:'num'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    if (!(this.params[0].name in params.map)) {
      return new CompilationError(ErrorName.Fxn_MissingRequiredParam,values.map(e => e.symbol),this.params[0].name,'Normalizer.operate param check');
    }
    const rawVec = params.map[this.params[0].name];
    if (rawVec instanceof GenericVector && rawVec.castableTo('nvec')) {
      if (rawVec.size == 0) {
        return new CompilationError(ErrorName.Norm_VectorSizeZero,rawVec,rawVec,'Normalizer.operate size=0');
      }
      const cvec = rawVec.castTo('nvec');
      let fxn: ((e:number) => number) | undefined;
      if (this.text == 'unit') { //mag of 1
        if (cvec.magnitude == 0) {
          return new CompilationError(ErrorName.Norm_ZeroMagnitude,cvec,cvec,'Normalizer.Operate unit mag=0');
        }
        fxn = (e:number) => e / cvec.magnitude;
      } else if (this.text == 'prob') {
        if (cvec.has(e => e<0)) {
          return new CompilationError(ErrorName.Norm_NegInProb,cvec,cvec,'Normalizer.operate prob elem<0');
        }
        fxn = (e:number) => e / SuperMath.sum(cvec.asNumberArray);
      } else if (this.text == 'norm') {
        const sigma = SuperMath.sampleStd(cvec.asNumberArray);
        if (sigma == 0) {
          return new CompilationError(ErrorName.Norm_ZeroSD,cvec,cvec,'Normalizer.operate norm sigma=0');
        }
        fxn = e => (e - SuperMath.mean(cvec.asNumberArray)) / sigma;
      } else {
        return new CompilationError(ErrorName.IllegalExpression,values.map(e => e.symbol),values.map(e => e.symbol),'Normalizer.operate wtf');
      }
      const normalized = cvec.map(fxn);
      if (normalized instanceof CompilationError) {
        return normalized;
      }
      return {value:normalized,warnings:params.warnings};
    }
    return new CompilationError(ErrorName.Norm_NonConstantVector,values.map(e => e.symbol),values.map(e => e.symbol),'Normalizer.operate non-cvec');
  }
}
class VectorSorter extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'sort','Sorts a vector in ascending order unless reverse parameter is set to true',[
      {name:'v',types:['nvec','svec'],desc:'The vector to sort'},
      {name:'reverse',types:['bool'],desc:'Whether to flip the sort direction',optional:true,default:'false'},
    ],[{type:'num'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    if (!(this.params[0].name in params.map)) {
      return new CompilationError(ErrorName.Fxn_MissingRequiredParam,values.map(e => e.symbol),this.params[0].name,'VectorSorter.operate v check');
    }
    const vec = params.map[this.params[0].name];
    let vectorValues: number[] | string[];
    if (vec instanceof GenericVector && vec.castableTo('nvec')) {
      vectorValues = vec.castTo('nvec').asNumberArray;
    } else if (vec instanceof GenericVector && vec.castableTo('svec')) {
      vectorValues = vec.castTo('svec').asStringArray;
    } else {
      return new CompilationError(ErrorName.Sorting_WrongVector,vec,vec,'VectorSorter.operate vector check');
    }
    let reverse: boolean = false;
    if (this.params[1].name in params.map) {
      const bool = params.map[this.params[1].name];
      if (bool instanceof StorableSymbol && bool.castableTo('bool')) {
        reverse = bool.castTo('bool').value;
      } else {
        return new CompilationError(ErrorName.Sorting_WrongReverse,bool,bool,'VectorSorter.operate reverse check');
      }
    }
    const sortedValues = vectorValues.toSorted((a,b) => (a>b?1:-1) * (reverse?-1:1));
    const finalValues: (NumberValue|StringValue)[] = [];
    for (const val of sortedValues) {
      if (typeof val == 'string') {
        finalValues.push(new StringValue(-1,this.line,val,''));
      } else {
        finalValues.push(new NumberValue(-1,this.line,val,''));
      }
    }
    const finalVector = GenericVector.FromArray(finalValues,this.line);
    if (finalVector instanceof CompilationError) {
      return finalVector;
    }
    return {value:finalVector,warnings:params.warnings};
  }
}
class TraceDeterminate extends BuiltInFunction {
  public constructor(index: number,line: CodeLine,name: 'trace' | 'deter') {
    super(index,line,name,`Takes the ${name=='trace'?'trace':'determinate'} of a constant matrix`,[
      {name:'m',types:['nmtx'],desc:`The matrix of which to take the ${name=='trace'?'trace':'determinate'}`},
    ],[{type:'num'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    if (!('m' in params.map)) {
      return new CompilationError(ErrorName.Fxn_MissingRequiredParam,values.map(e => e.symbol),'m','TraceDeterminate.operate');
    }
    const matrix = params.map.m as NumberMatrix;
    if (!matrix.isSquare) {
      return new CompilationError(
        this.value=='deter'?ErrorName.Deter_NonSquare:ErrorName.Trace_NonSquare,
        matrix,matrix,'TraceDeterminate.operate non-square matrix'
      );
    }
    const value = this.text=='deter' ? matrix.determinate : matrix.trace;
    if (value == null) {
      return new CompilationError(ErrorName.IllegalExpression,matrix,matrix,'TraceDeterminate.operate wtf');
    }
    return {value:new NumberValue(-1,this.line,value,''),warnings: params.warnings};
  }
}
class Diagonal extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'diag','Gets the diagonal elements of a matrix',[
      {name:'values',types:['nmtx'],desc:'The matrix from which to get the diagonals'}
    ],[{type:'nvec'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const matrix = params.map.values.castTo('nmtx');
    const elements: NumberValue[] = [];
    for (let i = 0; i < Math.min(matrix.rowCount,matrix.minColCount); i++) {
      elements.push(matrix.value[i].value[i]);
    }
    const vector = GenericVector.FromArray(elements,this.line);
    if (vector instanceof CompilationError) {
      return vector;
    }
    return {value:vector,warnings:params.warnings};
  }
}
class Join extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'join','Joins a string vector with a given string',[
      {name:'v',types:['svec'],desc:'The string vector to join'},
      {name:'sep',types:['str'],desc:'The value with which to join the string',optional:true,default:'" "'},
    ],[{type:'str'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const baseVector = params.map.v.castTo('svec');
    // let joinString = ' ';
    // if ('sep' in params.map) {
    //   joinString = params.map.sep.value as string;
    // }
    const joinString = params.map.sep?.castTo('str').value ?? ' ';
    return {value:new StringValue(-1,this.line,baseVector.value.map(e => e.rawValue).join(joinString),''),warnings:params.warnings};
  }
}
class Split extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'split','Splits a string into a string vector with a given string',[
      {name:'s',types:['str'],desc:'The string to split'},
      {name:'sep',types:['str'],desc:'The value with which to split the string',optional:true,default:'" "'},
    ],[{type:'svec'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const baseString = params.map.s.castTo('str');
    // let splitString = '\u00a0';
    // if ('sep' in params.map) {
    //   splitString = (params.map.sep.value as string);
    // }
    const splitString = params.map.sep?.castTo('str').rawValue ?? '\u00a0';
    const vectorList: StringValue[] = [];
    console.log('SPLIT',baseString.rawValue,splitString);
    for (const word of baseString.rawValue.split(splitString)) {
      vectorList.push(new StringValue(-1,this.line,word,''));
    }
    return {value:new StringVector(-1,this.line,vectorList,''),warnings:params.warnings};
  }
}
class LeastSquaresRegression extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'lsr','Takes a least squared regression',[
      {name:'x',types:['nvec','nmtx'],desc:'The dependant values'},
      {name:'y',types:['nvec'],desc:'The independant values'},
      {name:'int',types:['bool'],desc:'Whether to include an intercept in the regression result - ignored with singlevariate regressoin',optional:true,default:'true'},
    ],[{type:'nvec'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const yVector = params.map.y as NumberVector;
    if (params.map.x instanceof NumberVector) {
      const xVector = params.map.x as NumberVector;
      if (xVector.size != yVector.size) {
        return new CompilationError(ErrorName.LSR_VectorSizeMismatch,[xVector,yVector],[xVector,yVector],'LSR.operate singlevar size check');
      }
      if (xVector.size == 0 || yVector.size == 0) {
        return new CompilationError(ErrorName.LSR_VectorZeroSize,[xVector,yVector],[xVector,yVector],'LSR.operate singlevar size=0');
      }
      const result = SuperMath.leastSquaresRegression(xVector.asNumberArray,yVector.asNumberArray);
      return {value:new NumberVector(-1,this.line,[
        new NumberValue(-1,this.line,result.slope,''),
        new NumberValue(-1,this.line,result.intercept,''),
        new NumberValue(-1,this.line,result.rSquared,''),
      ],'',undefined,undefined,['m','b','r']),warnings:params.warnings};
    } else { //cmtx
      let includeIntercept = true;
      if (params.map.int instanceof BooleanValue) {
        includeIntercept = params.map.int.value;
      }
      let xMatrix = params.map.x as NumberMatrix;
      if (!xMatrix.isRectangular) {
        return new CompilationError(ErrorName.LSR_NonRectangularMatrix,xMatrix,xMatrix,'LSR.operate multivar nonrect');
      }
      if (xMatrix.rowCount != yVector.size) {
        return new CompilationError(ErrorName.LSR_VariableCountMismatch,[xMatrix,yVector],[xMatrix,yVector],'LSR.operate multivar row/size check');
      }
      if (xMatrix.maxColCount == 0) {
        return new CompilationError(ErrorName.LSR_NoColumnsInMatrix,xMatrix,xMatrix,'LSR.operate multivar mtx col check');
      }
      if (xMatrix.rowCount == 0 || yVector.size == 0) {
        return new CompilationError(ErrorName.LSR_VectorZeroSize,[xMatrix,yVector],[xMatrix,yVector],'LSR.operate multivar size=0');
      }
      if (xMatrix.maxColCount + (includeIntercept?1:0) > yVector.size) {
        return new CompilationError(ErrorName.LSR_TooManyVariables,[xMatrix,yVector],[xMatrix,yVector],'LSR.operate multivar too many vars');
      }
      const result = SuperMath.multivariateLeastSquaresRegression(xMatrix.asNumericMatrix!,yVector.asNumberArray,includeIntercept);
      if (result == null) {
        return new CompilationError(ErrorName.LSR_PossibleCollinearity,this,this,'LSR.operate multivar collin');
      }
      const vectorConstants: NumberValue[] = [];
      const namedIndexes: string[] = [];
      for (let i = 0; i < result.slopes.length; i++) {
        vectorConstants.push(new NumberValue(-1,this.line,result.slopes[i],''));
        namedIndexes.push('m' + (i+1));
      }
      vectorConstants.push(new NumberValue(-1,this.line,result.intercept,''));
      vectorConstants.push(new NumberValue(-1,this.line,result.rSquared,''));
      namedIndexes.push('b','r');
      return {
        value: new NumberVector(-1,this.line,vectorConstants,'',undefined,undefined,namedIndexes),
        warnings: params.warnings
      };
    }
  }
}
class RSquared extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'rsq','Finds the coefficient of determination between two vectors',[
      {name:'x',types:['nvec'],desc:'A list of values'},
      {name:'y',types:['nvec'],desc:'A list of values'},
    ],[{type:'num'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const xVector = params.map.x as NumberVector;
    const yVector = params.map.y as NumberVector;
    if (xVector.size != yVector.size) {
      return new CompilationError(ErrorName.RSQ_VectorSizeMismatch,[xVector,yVector],[xVector,yVector],'RSQ.operate not same size');
    }
    if (xVector.size == 0 || yVector.size == 0) {
      return new CompilationError(ErrorName.RSQ_VectorZeroSize,[xVector,yVector],[xVector,yVector],'RSQ.operate size=0');
    }
    return {
      value: new NumberValue(-1,this.line,SuperMath.calculateRSquared(xVector.asNumberArray,yVector.asNumberArray),''),
      warnings: params.warnings
    };
  }
}
class Identity extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'identity','Builds an n-by-n identity matrix',[
      {name:'n',types:['num'],desc:'The number of values to have in the identity matrix'},
    ],[{type:'nmtx'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const dimensions = params.map.n.castTo('num').value;
    if (dimensions < 1) {
      return new CompilationError(ErrorName.Identity_NegativeDimensions,params.map.n,params.map.n,'Identity.operate');
    }
    if (!Number.isInteger(dimensions)) {
      return new CompilationError(ErrorName.Identity_NonInteger,params.map.n,params.map.n,'Identity.operate');
    }
    const matrix = Matrix.Identity(dimensions);
    return {value:NumberMatrix.FromNumericMatrix(matrix,this.line),warnings:params.warnings};
  }
}
class Inverse extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'inv','Inverts a matrix',[
      {name:'m',types:['nmtx'],desc:'The matrix to invert'},
    ],[{type:'nmtx'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const matrix = params.map.m.castTo('nmtx');
    if (!matrix.isSquare) {
      return new CompilationError(ErrorName.Inverse_NonSquare,matrix,matrix,'Inverse.operate non-square');
    }
    if (matrix.rowCount == 0) {
      return new CompilationError(ErrorName.Inverse_SizeZero,matrix,matrix,'Inverse.operate size=0');
    }
    const inverse = matrix.asNumericMatrix!.getInverse();
    if (inverse == null) {
      return new CompilationError(ErrorName.Inverse_NonInvertible,matrix,matrix,'Inverse.operate singular');
    }
    return {value:NumberMatrix.FromNumericMatrix(inverse,this.line),warnings:params.warnings};
  }
}
class Unique extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'unique','Returns a list with duplicated removed',[
      {name:'x',types:['list'],desc:'The list from which to remove duplicates'}
    ],[{type:'list'}])
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const listObject = params.map.x.castTo('list');
    if (listObject.size == 0) {
      return {value:new EmptyVector(-1,this.line,''),warnings:params.warnings};
    }
    const uniqueValues: AbstractStorable[] = [listObject.value[0]];
    outerLoop: for (let i = 1; i < listObject.size; i++) {
      for (let j = 0; j < uniqueValues.length; i++) {
        if (listObject.value[i].equals(uniqueValues[j])) {
          continue outerLoop;
        }
      }
      uniqueValues.push(listObject.value[i]);
    }
    const uniqueVector = GenericVector.FromArray(uniqueValues,this.line);
    if (uniqueVector instanceof CompilationError) {
      return uniqueVector;
    }
    return {value:uniqueVector,warnings:params.warnings};
  }
}
class Union extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'union','Find all common elements between two lists in order of appearance in list1',[
      {name:'list1',types:['list'],desc:'The first list'},
      {name:'list2',types:['list'],desc:'The second list'},
    ],[{type:'list'}])
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const list1 = params.map.list1.castTo('list');
    const list2 = params.map.list2.castTo('list');
    const commonValues: AbstractStorable[] = [];
    for (const val of list1.value) {
      if (commonValues.some(e => e.equals(val))) {
        continue;
      }
      if (list2.value.some(e => e.equals(val))) {
        commonValues.push(val);
      }
    }
    const commonVector = GenericVector.FromArray(commonValues,this.line);
    if (commonVector instanceof CompilationError) {
      return commonVector;
    }
    return {value:commonVector,warnings:params.warnings};
  }
}

// ~ DATE AND OFFSET VALUES ~

type StdDatePart = 'year' | 'month' | 'day';
type ISODatePart = 'iso_year' | 'iso_week' | 'day_of_week';
type TimePart = 'hour' | 'minute' | 'second';
type DatePart = StdDatePart | ISODatePart | TimePart;
class DateValue extends KeyableSymbol<Date> implements IComparable<DateValue> {
  public readonly specified: Readonly<Partial<Record<DatePart,boolean>>>;

  public constructor(index: number,line: CodeLine,value: Date,text: string,specified: Partial<Record<DatePart,boolean>>,name?: string) {
    super(index,line,value,text,'date',name);
    this.specified = specified;
  }

  public static Now(line: CodeLine,index: number = -1): DateValue {
    return new DateValue(index,line,new Date(),'',{
      year:true,month:true,day:true,
      hour:true,minute:true,second:true,
      iso_year:true,iso_week:true,day_of_week:true
    });
  }

  public rename(index: number,name: string,line: CodeLine): DateValue {
    return new DateValue(index,line,this.value,name,this.specified,name);
  }
  public clone(index: number,text?: string,line?: CodeLine): DateValue {
    return new DateValue(index,line ?? this.line,this.value,text ?? this.text,this.specified,this.name);
  }
  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (!(other instanceof StorableSymbol) || other.type != this.type) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    return this.value.getTime() == other.value.getTime();
  }
  get preview(): string {
    if ((this.specified.iso_year || this.specified.iso_week || this.specified.day_of_week) && !this.specified.year) {
      const dow = this.value.getDay();
      return SuperDate.getISOYear(this.value) + '-W' + SuperDate.getISOWeek(this.value) + '-' + (dow==0?7:dow);
    }
    let str = '';
    if (this.specified.year) {
      str += this.value.getFullYear();
      if (this.specified.month) {
        str += '-' + (this.value.getMonth()+1).toFixed().padStart(2,'0');
        if (this.specified.day) {
          str += '-' + this.value.getDate().toFixed().padStart(2,'0');
        }
      }
    }
    if (this.specified.hour) {
      if (str.length > 0) {
        str += ' ';
      }
      str += this.value.getHours().toFixed().padStart(2,'0');
      if (this.specified.minute) {
        str += ':' + this.value.getMinutes().toFixed().padStart(2,'0');
        if (this.specified.second) {
          str += ':' + this.value.getSeconds().toFixed().padStart(2,'0');
        }
      }
    }
    return str;
  }

  public compare(other: DateValue,type: '>'|'>='|'<'|'<='): boolean {
    if (type == '<') {
      return this.value < other.value;
    } else if (type == '<=') {
      return this.value <= other.value;
    } else if (type == '>') {
      return this.value > other.value;
    } else if (type == '>=') {
      return this.value >= other.value;
    }
    return false;
  }

  get hasAllStandard(): boolean { return (this.specified.year && this.specified.month && this.specified.day) ?? false; }
  get hasAllISO(): boolean { return (this.specified.iso_year && this.specified.iso_week && this.specified.day_of_week) ?? false; }

  get propertyNames(): (string|undefined)[] {
    return [
      this.specified.year||this.hasAllISO?'year':undefined,
      this.specified.month||this.hasAllISO?'month':undefined,
      this.specified.day||this.hasAllISO?'day':undefined,
      this.specified.hour?'hour':undefined,
      this.specified.minute?'minute':undefined,
      this.specified.second?'second':undefined,
      this.specified.iso_year||this.hasAllStandard?'iso_year':undefined,
      this.specified.iso_week||this.hasAllStandard?'iso_week':undefined,
      this.specified.day_of_week||this.hasAllStandard?'day_of_week':undefined,
    ];
  }
  public getNamedProperty(index: AbstractSymbol,line: CodeLine): AbstractStorable | CompilationError {
    const value = KeyableSymbol.getPropName(index);
    let property: number | undefined;
    if (value == 'year' && (this.specified.year || this.hasAllISO)) {
      property = this.value.getFullYear();
    } else if (value == 'month' && (this.specified.month || this.hasAllISO)) {
      property = this.value.getMonth() + 1;
    } else if (value == 'day' && (this.specified.day || this.hasAllISO)) {
      property = this.value.getDate();
    } else if (value == 'hour' && this.specified.hour) {
      property = this.value.getHours();
    } else if (value == 'minute' && this.specified.minute) {
      property = this.value.getMinutes();
    } else if (value == 'second' && this.specified.second) {
      property = this.value.getSeconds();
    } else if (value == 'iso_year' && (this.specified.iso_year || this.hasAllStandard)) {
      property = SuperDate.getISOYear(this.value);
    } else if (value == 'iso_week' && (this.specified.iso_week || this.hasAllStandard)) {
      property = SuperDate.getISOWeek(this.value);
    } else if (value == 'day_of_week' && (this.specified.day_of_week || this.hasAllStandard)) {
      property = this.value.getDay()==0?7:this.value.getDay();
    }
    if (property == undefined) {
      return new CompilationError(ErrorName.SIndex_Invalid,index,index,'DateValue.getProp');
    }
    return new NumberValue(-1,line,property,'');
  }
}
class DateInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'date','Gets a date from numerical values - passing no values returns the current date and time',[
      {name:'year',types:['num'],desc:'The year',optional:true,default:'now'},
      {name:'month',types:['num'],desc:'The month - January=1,February=2,...,December=12',optional:true,default:'now'},
      {name:'day',types:['num'],desc:'The day in the month - [1,28-31]',optional:true,default:'now'},
      {name:'hour',types:['num'],desc:'The hour in a 24-hour format - [0,23]',optional:true,default:'now'},
      {name:'minute',types:['num'],desc:'The minutes in the hour - [0,59]',optional:true,default:'now'},
      {name:'second',types:['num'],desc:'The seconds in the minute - [0,59]',optional:true,default:'now'}
    ],[{type:'date'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    if (Object.keys(params.map).length == 0) {
      return {value:DateValue.Now(this.line),warnings:params.warnings};
    }
    const now = new Date();
    const dateValues: Record<StdDatePart|TimePart,number> = {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds()
    };
    const specified: Record<StdDatePart|TimePart,boolean> = {
      year: false,
      month: false,
      day: false,
      hour: false,
      minute: false,
      second: false
    };
    if ('year' in params.map) {
      dateValues.year = params.map.year.castTo('num').value;
      specified.year = true;
    }
    if ('month' in params.map) {
      if (!specified.year) {
        return new CompilationError(ErrorName.Date_NoYear,params.map.month,params.map.month,'DateCon.operate year check');
      } else {
        dateValues.month = params.map.month.castTo('num').value-1;
        specified.month = true;
      }
    }
    if ('day' in params.map) {
      if (!specified.month) {
        return new CompilationError(ErrorName.Date_NoMonth,params.map.day,params.map.day,'DateCon.operate month check');
      } else {
        dateValues.day = params.map.day.castTo('num').value;
        specified.day = true;
      }
    }
    if ('hour' in params.map) {
      dateValues.hour = params.map.hour.castTo('num').value;
      specified.hour = true;
    }
    if ('minute' in params.map) {
      if (!specified.hour) {
        return new CompilationError(ErrorName.Date_NoHour,params.map.minute,params.map.minute,'DateCon.operate hour check');
      } else {
        dateValues.minute = params.map.minute.castTo('num').value;
        specified.minute = true;
      }
    }
    if ('second' in params.map) {
      if (!specified.minute) {
        return new CompilationError(ErrorName.Date_NoMinute,params.map.second,params.map.second,'DateCon.operate minute check');
      } else {
        dateValues.second = params.map.second.castTo('num').value;
        specified.second = true;
      }
    }
    for (const key of keys(dateValues)) {
      if (dateValues[key] < (key=='year'||key=='day'?1:0) || !Number.isInteger(dateValues[key])) {
        return new CompilationError(ErrorName.Date_IllegalValue,params.map[key],key,'Check date values');
      }
    }
    if (dateValues.month >= 12) {
      return new CompilationError(ErrorName.Date_IllegalValue,params.map.month,'month','Check date values');
    }
    if (dateValues.day >= SuperDate.getDaysInMonth(dateValues.year,dateValues.month)) {
      return new CompilationError(ErrorName.Date_IllegalValue,params.map.day,'day','Check date values');
    }
    if (dateValues.hour >= 24) {
      return new CompilationError(ErrorName.Date_IllegalValue,params.map.hour,'hour','Check date values');
    }
    if (dateValues.minute >= 60) {
      return new CompilationError(ErrorName.Date_IllegalValue,params.map.hour,'minute','Check date values');
    }
    if (dateValues.second >= 60) {
      return new CompilationError(ErrorName.Date_IllegalValue,params.map.hour,'second','Check date values');
    }
    return {value:new DateValue(-1,this.line,new Date(
      dateValues.year,dateValues.month,dateValues.day,dateValues.hour,dateValues.minute,dateValues.second
    ),'',specified),warnings:params.warnings};
  }

  get propertyNames() { return ['from_str','from_week']; }

  public getNamedProperty(index: AbstractSymbol): CompilationError | AbstractStorable {
    const name = KeyableSymbol.getPropName(index);
    if (name == 'from_week') {
      return new DateWeekInator(-1,CodeLine.Unlinked());
    }
    if (name == 'from_str') {
      return new DateStringInator(-1,CodeLine.Unlinked());
    }
    return new CompilationError(ErrorName.SIndex_Invalid,index,index,'DateCon.getNamedProperty');
  }
}
class DateWeekInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'from_week','Gets a date from an ISO year, week, and day',[
      {name:'year',types:['num'],desc:'The year'},
      {name:'week',types:['num'],desc:'The week - [1,52-53]'},
      {name:'day',types:['num'],desc:'The day of week - Monday=1,Tuesday=2,...,Sunday=7'},
    ],[{type:'date'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const year = params.map.year.castTo('num').value;
    if (!Number.isInteger(year)) {
      return new CompilationError(ErrorName.Date_IllegalValue,params.map.year,'year','DateWeek.operate year check');
    }
    const week = params.map.week.castTo('num').value;
    if (!Number.isInteger(week) || week < 1 || week > SuperDate.getWeeksInISOYear(year)) {
      return new CompilationError(ErrorName.Date_IllegalValue,params.map.week,'week','DateWeek.operate week check');
    }
    const day = params.map.day.castTo('num').value;
    if (!Number.isInteger(day) || day < 1 || day > 7) {
      return new CompilationError(ErrorName.Date_IllegalValue,params.map.day,'day','DateWeek.operate day check');
    }
    const date = SuperDate.getDateFromISOYearWeekDay(year,week,day);
    if (date == undefined) {
      return new CompilationError(ErrorName.IllegalExpression,values.map(e => e.symbol),values.map(e => e.symbol),'from iso week wtf');
    }
    return {value:new DateValue(-1,this.line,date,'',{
      iso_week: true,
      iso_year: true,
      day_of_week: true
    }),warnings:params.warnings};
  }
}
class DateStringInator extends BuiltInFunction {
  private static readonly monthMap: Readonly<Record<string,number>> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  private static readonly weekDayMap: Readonly<Record<string,number>> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  }
  private static readonly isoShortWeek = /^[1-9]\d*-(W|w)([1-9]|[1-4]\d|5[0-3])$/; //2024-W1
  private static readonly isoLongWeek = /^[1-9]\d*-(W|w)([1-9]|[1-4]\d|5[0-3])-[1-7]$/; //2024-W1-1
  private static readonly dayOfMonth = new RegExp('0?[1-9]|[1-2]\\d|30|31');
  private static readonly ddmmyyyy = new RegExp(`^(${DateStringInator.dayOfMonth.source})[-/](0?[1-9]|10|11|12)[-/][1-9]\\d*$`); //20-01-2024
  private static readonly yyyymmdd = new RegExp(`^[1-9]\\d*[-/](0?[1-9]|10|11|12)[-/](${DateStringInator.dayOfMonth.source})$`); //2024-01-20
  private static readonly dayOfWeek = /^(mon|tue|wed|thu|fri|sat|sun|tues|thurs|sunday|monday|tuesday|wednesday|thursday|friday|saturday)[, ]\s*/i;
  private static readonly month = new RegExp(`(${Object.keys(DateStringInator.monthMap).join('|')})[, ]\\s*`);
  private static readonly quinn = new RegExp(`^(${DateStringInator.dayOfMonth.source})\\s+${DateStringInator.month.source}[1-9](\\d*)$`,'i'); //04 jan 2024
  private static readonly reverseQuinn = new RegExp(`^[1-9]\\d*\\s+${DateStringInator.month.source}(${DateStringInator.dayOfMonth.source})$`,'i'); //04 jan 2024
  private static readonly america = new RegExp(`^${DateStringInator.month.source}(${DateStringInator.dayOfMonth.source})[, ]\\s*[1-9](\\d*)$`,'i');
  private static readonly hourMinute = /(0?\d|1\d|2[0-3]):(0?\d|[1-5]\d)(:(0?\d|[1-5]\d))?\s*(a|am|p|pm)?$/i;

  public constructor(index: number,line: CodeLine) {
    super(index,line,'from_str','Gets a date a string',[
      {name:'val',types:['str'],desc:'The string to parse as a date'},
    ],[{type:'date'}]);
  }

  public static parse(val: string): {specified:Readonly<Partial<Record<DatePart,boolean>>>,date:Date} | undefined {
    const specified: Partial<Record<DatePart,boolean>> = {};
    let date: Date | undefined;
    let yearMonthDay: number[] | undefined;
    let hourMinuteSecond: number[] | undefined;
    let str = val.slice();
    let weekDayMatch: string | undefined;

    if (DateStringInator.dayOfWeek.test(str)) {
      const match = str.match(DateStringInator.dayOfWeek)![0];
      weekDayMatch = match.replace(/,/g,'').toLowerCase().trim();
      str = str.replace(match,'');
    }
    if (DateStringInator.hourMinute.test(str)) {
      const meridian = ((str.match(/[a-z]+$/gi) ?? [])[0] ?? '').toLowerCase();
      const match = str.match(DateStringInator.hourMinute)![0];
      const components = match.toLowerCase().replace(meridian,'').replace(/ /g,' ').split(':');
      const hours = components.slice(0,3).map(Number);
      if (hours[0] >= 13 && (meridian == 'am' || meridian == 'a')) {
        return undefined;
      }
      if ((meridian == 'pm' || meridian == 'p') && hours[0] < 12) {
        hours[0] += 12;
      } else if ((meridian == 'am' || meridian == 'a') && hours[0] == 12) {
        hours[0] = 0;
      }
      str = str.replace(match,'').trim();
      hourMinuteSecond = hours;
    }
    if (DateStringInator.isoShortWeek.test(str) || DateStringInator.isoLongWeek.test(str)) { //iso week format
      const match = (str.match(DateStringInator.isoLongWeek) || str.match(DateStringInator.isoShortWeek)!)[0];
      const components: number[] = match.replace(/W/i,'').split('-').map(Number);
      specified.iso_year = true;
      specified.iso_week = true;
      specified.day_of_week = true;
      date ??= SuperDate.getDateFromISOYearWeekDay(components[0],components[1],components[2] ?? 1);
    } else if (DateStringInator.ddmmyyyy.test(str)) {
      const components = str.match(DateStringInator.ddmmyyyy)![0].replace(/\//g,'-').split('-').map(Number);
      yearMonthDay = [components[2],components[1],components[0]];
    } else if (DateStringInator.yyyymmdd.test(str)) {
      const components = str.match(DateStringInator.yyyymmdd)![0].replace(/\//g,'-').split('-').map(Number);
      yearMonthDay = [components[0],components[1],components[2]];
    } else if (DateStringInator.quinn.test(str)) {
      const components = str.match(DateStringInator.quinn)![0].replace(/,/g,'').replace(/\s\s+/g,' ').split(' ');
      yearMonthDay = [Number(components[2]),DateStringInator.monthMap[components[1].substring(0,3) as 'jan'],Number(components[0])];
    } else if (DateStringInator.reverseQuinn.test(str)) {
      const components = str.match(DateStringInator.reverseQuinn)![0].replace(/,/g,'').replace(/\s\s+/g,' ').split(' ');
      yearMonthDay = [Number(components[0]),DateStringInator.monthMap[components[1].substring(0,3) as 'jan'],Number(components[2])];
    } else if (DateStringInator.america.test(str)) {
      const components = str.match(DateStringInator.america)![0].replace(/,/g,'').replace(/\s\s+/g,' ').split(' ');
      yearMonthDay = [Number(components[2]),DateStringInator.monthMap[components[0].substring(0,3) as 'jan'],Number(components[1])];
    } else if (str.length > 0) {
      return undefined;
    }
    if (yearMonthDay) {
      date ??= new Date(yearMonthDay[0],yearMonthDay[1]-1,yearMonthDay[2]);
      specified.year = true;
      specified.month = true;
      specified.day = true;
    }
    if (hourMinuteSecond) {
      date ??= new Date();
      date.setHours(hourMinuteSecond[0]);
      date.setMinutes(hourMinuteSecond[1]);
      date.setSeconds(hourMinuteSecond[2] ?? 0);
      specified.hour = true;
      specified.minute = true;
      specified.second = hourMinuteSecond[2] != undefined;
    }
    if (date == undefined) {
      return undefined;
    }
    if (weekDayMatch && DateStringInator.weekDayMap[weekDayMatch.substring(0,3) as 'sun'] != date.getDay()) {
      return undefined;
    }
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return {specified,date};
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const str = params.map.val.castTo('str').rawValue;
    const result = DateStringInator.parse(str);
    if (result == undefined) {
      return new CompilationError(ErrorName.IllegalExpression,undefined,undefined,'');
    }
    return {value:new DateValue(-1,this.line,result.date,'',result.specified),warnings:params.warnings};
  }
}
interface IOffsetValue { //NOTE: if add more value, update Offset.equals
  readonly year?: number;
  readonly month?: number;
  readonly day?: number;
  readonly hour?: number;
  readonly minute?: number;
  readonly second?: number;
}
class Offset extends StorableSymbol<IOffsetValue> {
  private static readonly valueNames: ReadonlyArray<string> = ['year','month','day','hour','minute','second'];

  public constructor(index: number,line: CodeLine,value: IOffsetValue,text: string,name?: string) {
    super(index,line,value,text,'offset',name);
  }

  public clone(index: number,text?: string,line?: CodeLine): Offset {
    return new Offset(index,line ?? this.line,this.value,text ?? this.text,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): Offset {
    return new Offset(index,line,this.value,name,name);
  }
  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (!(other instanceof Offset)) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    for (const name of Offset.valueNames) {
      if ((this.value[name as 'day'] ?? 0) != (other.value[name as 'day'] ?? 0)) {
        return false;
      }
    }
     return true;
  }
  get preview(): string {
    const props: string[] = [];
    for (const name of Offset.valueNames) {
      if ((this.value[name as 'day'] ?? 0) != 0) {
        props.push(name + '=' + SuperMath.renderNumber(this.value[name as 'day'] ?? 0));
      }
    }
    return props.length==0?'<no offset>':props.join(',');
  }
}
class OffsetInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'offset','Builds a date offset',[
      {name:'year',types:['num'],desc:'The offset in years',optional:true,default:'0'},
      {name:'month',types:['num'],desc:'The offset in years',optional:true,default:'0'},
      {name:'day',types:['num'],desc:'The offset in years',optional:true,default:'0'},
      {name:'hour',types:['num'],desc:'The offset in years',optional:true,default:'0'},
      {name:'minute',types:['num'],desc:'The offset in years',optional:true,default:'0'},
      {name:'second',types:['num'],desc:'The offset in years',optional:true,default:'0'},
    ],[{type:'offset'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const offsetValue: IOffsetValue = {
      year: params.map.year?.castTo('num').value,
      month: params.map.month?.castTo('num').value,
      day: params.map.day?.castTo('num').value,
      hour: params.map.hour?.castTo('num').value,
      minute: params.map.minute?.castTo('num').value,
      second: params.map.second?.castTo('num').value,
    };
    for (const name of keys(offsetValue)) {
      if (offsetValue[name] && !Number.isInteger(offsetValue[name])) {
        return new CompilationError(ErrorName.Offset_NonIntegerOffset,params.map[name],params.map[name],'OffsetInator.operate non-int');
      }
    }
    return {
      value: new Offset(-1,this.line,offsetValue,''),
      warnings: params.warnings
    };
  }
}

// ~ MATRIXINATOR ~

class MatrixInator extends BuiltInFunction {
  private readonly neededType: 'nvec' | 'vvec';

  public constructor(index: number,line: CodeLine,name: 'nmtx' | 'vmtx') {
    const neededType = name=='nmtx'?'nvec':'vvec';
    super(index,line,name,`Builds a ${name} from a ${neededType}`,[
      {name:'values',types:[neededType],desc:'The value to put in the matrix'},
      {name:'nrow',types:['num'],desc:'The number of rows the matrix should have',optional:true,default:'auto'},
      {name:'ncol',types:['num'],desc:'The number of column the matrix should have',optional:true,default:'auto'},
      {name:'byrow',types:['bool'],desc:'Whether to build the matrix by rows first',optional:true,default:'true'},
    ],[{type:name}]);
    this.neededType = neededType;
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const vec = params.map.values.castTo(this.neededType);
    let nrow: number = params.map.nrow?.castTo('num').value;
    let ncol: number = params.map.ncol?.castTo('num').value;
    const byRow = params.map.byrow?.castTo('bool').value ?? true;
    if (vec.size == 0) {
      nrow = 0;
      ncol = 0;
    } else if (nrow != undefined && ncol == undefined) {
      ncol = Math.ceil(vec.size / nrow);
    } else if (nrow == undefined && ncol != undefined) {
      nrow = Math.ceil(vec.size / ncol);
    } else if (nrow == undefined && ncol == undefined) {
      // const factors = SuperMath.getFactors(vec.size);
      // if (factors.length % 2 == 0) {
      //   nrow = factors[factors.length / 2 - 1];
      //   ncol = factors[factors.length / 2];
      // } else { //perfect square
      //   nrow = factors[ Math.floor(factors.length / 2) ];
      //   ncol = factors[ Math.floor(factors.length / 2) ];
      // }
      const arran = SuperMath.getGridArrangement(vec.size);
      ncol = arran.major;
      nrow = arran.minor;
    }
    const vectorRows: AbstractVector[] = [];
    let uneven = false;
    // console.log('DIMENSIONS','r',nrow,'c',ncol);
    const warnings: CompilationWarning[] = params.warnings ?? [];
    for (let r = 0; r < nrow; r++) {
      const vectorValues: (NumberValue|Variable)[] = [];
      for (let c = 0; c < ncol; c++) {
        const element = vec.get( byRow?r*ncol+c:c*nrow+r,this.line );
        if (element instanceof CompilationError) {
          break;
        }
        vectorValues.push(element);
      }
      const iterVector = GenericVector.FromArray(vectorValues,this.line);
      if (iterVector instanceof CompilationError) {
        continue;
      }
      if (vectorRows.length > 0 && !uneven) {
        uneven = iterVector.size != vectorRows[0].size;
      }
      vectorRows.push(iterVector);
    }
    if (uneven) {
      warnings.push(new CompilationWarning(WarningName.MatrixCon_NonRect,values.map(e => e.symbol),values.map(e => e.symbol),'MatrixCon uneven'));
    }
    const matrix = GenericVector.FromArray(vectorRows,this.line);
    if (matrix instanceof CompilationError) {
      return matrix;
    }
    if (!matrix.castableTo(this.text as 'nvec')) {
      return new CompilationError(ErrorName.MatrixCon_CouldNotBeConstructed,values.map(e => e.symbol),values.map(e => e.symbol),'MatrixCon wtf');
    }
    return {value:matrix.castTo(this.text as 'nvec'),warnings};
  }
}

// ~ MEASUREMENT VALUES ~

type SIUnit = typeof Measurement.siUnits[number];
type SIAdjUnit = typeof Measurement.siAdjUnits[number];
type SIDict = Partial<Record<SIUnit,number>>;
interface IMeasurementValue {
  readonly scalar: number;
  readonly units: SIDict;
}
type MeasurementType = 'length' | 'velocity' | 'acceleration' | 'jerk' | 'snap' | 'crackle' | 'pop' |
  'mass' | 'momentum' | 'force' | 'energy' | 'power' | 'electric potential' | 'resistance' |
  'magnetic flux density' | 'magnetic flux' | 'frequency' | 'inertia' | 'radial velocity' |
  'radial acceleration' | 'information' | 'area' | 'volume' | 'unknown';
class Measurement extends KeyableSymbol<IMeasurementValue> {
  public static readonly siUnits = ['s','m','kg','A','K','mol','cd','rad','byte'] as const;
  public static readonly siAdjUnits = ['N','J','W','V','Ω','Wb','T','Hz'] as const;

  public static readonly conversionCategories: Readonly<Record<string,string>> = {
    'ns': 'Time',
    'fm': 'Distance - Metric',
    'ly': 'Distance - Astronomical',
    'in': 'Distance - US Customary',
    'fg': 'Mass - Metric',
    'lb': 'Mass - US Customary',
    'V': 'Electrical',
    '°R': 'Temperature',
    'lm': 'Light',
    'deg': 'Angle',
    'kph': 'Velocity',
    'ha': 'Area',
    'fL': 'Volume - Metric',
    'tsp': 'Volume - US Customary',
    'N': 'Physics - Metric',
    'BTU': 'Physics - US Customary',
    'mpg': 'Fuel Economy',
    'bit': 'Information',
    'Nm': 'Miscellaneous'
  };
  public static readonly conversionTable: Record<string,IMeasurementValue & {alt?:Record<string,number>}> = {
    //time
    'fs': {scalar:1e-15,units:{s:1}},
    'ps': {scalar:1e-12,units:{s:1}},
    'ns': {scalar:1e-9,units:{s:1}},
    'μs': {scalar:1e-6,units:{s:1}},
    'ms': {scalar:1e-3,units:{s:1}},
    'sec': {scalar:1,units:{s:1},alt:{'s':1}},
    'min': {scalar:60,units:{s:1}},
    'hr': {scalar:3600,units:{s:1}},
    'hour': {scalar:3600,units:{s:1},alt:{'hr':1}},
    'day': {scalar:86_400,units:{s:1}},
    'week': {scalar:604_800,units:{s:1},alt:{'wk':1}},
    'wk': {scalar:604_800,units:{s:1}},
    'fn': {scalar:1_209_600,units:{s:1}},
    'month': {scalar:2_592_000,units:{s:1},alt:{'mon':1}},
    'mon': {scalar:2_592_000,units:{s:1}},
    'year': {scalar:31_536_000,units:{s:1},alt:{'yr':1}},
    'yr': {scalar:31_536_000,units:{s:1}},
    //distance-metric
    'fm': {scalar:1e-15,units:{m:1}},
    'pm': {scalar:1e-12,units:{m:1}},
    'nm': {scalar:1e-9,units:{m:1}},
    'μm': {scalar:1e-6,units:{m:1}},
    'micron': {scalar:1e-6,units:{m:1},alt:{'μm':1}},
    'mm': {scalar:1e-3,units:{m:1}},
    'cm': {scalar:1e-2,units:{m:1}},
    'dm': {scalar:1e-1,units:{m:1}},
    'dam': {scalar:10,units:{m:1}},
    'hm': {scalar:100,units:{m:1}},
    'km': {scalar:1000,units:{m:1}},
    'Mm': {scalar:1e6,units:{m:1}},
    'Gm': {scalar:1e9,units:{m:1}},
    'Tm': {scalar:1e12,units:{m:1}},
    'Pm': {scalar:1e15,units:{m:1}},
    //distance-astronomical
    'ly': {scalar:9.4607e15,units:{m:1}},
    'pc': {scalar:3.0857e16,units:{m:1}},
    //distance-imperial
    'in': {scalar:0.0254,units:{m:1}},
    'ft': {scalar:0.3048,units:{m:1}},
    'yd': {scalar:0.9144,units:{m:1}},
    'yard': {scalar:0.9144,units:{m:1},alt:{'yd':1}},
    'fur': {scalar:201.168,units:{m:1}},
    'mi': {scalar:1609.34,units:{m:1}},
    'NM': {scalar:1852,units:{m:1},alt:{'nmi':1}},
    'nmi': {scalar:1852,units:{m:1}},
    //mass-metric
    'fg': {scalar:1e-18,units:{kg:1}},
    'pg': {scalar:1e-15,units:{kg:1}},
    'ng': {scalar:1e-12,units:{kg:1}},
    'μg': {scalar:1e-9,units:{kg:1}},
    'mg': {scalar:1e-6,units:{kg:1}},
    'cg': {scalar:1e-5,units:{kg:1}},
    'dg': {scalar:1e-4,units:{kg:1}},
    'g': {scalar:1e-3,units:{kg:1}},
    'dag': {scalar:1e-2,units:{kg:1}},
    'hg': {scalar:1e-1,units:{kg:1}},
    'Mg': {scalar:1e3,units:{kg:1}},
    'Gg': {scalar:1e6,units:{kg:1}},
    'Tg': {scalar:1e9,units:{kg:1}},
    'Pg': {scalar:1e12,units:{kg:1}},
    'ct': {scalar:0.0002,units:{kg:1}},
    //mass-imperial
    'lb': {scalar:0.453592,units:{kg:1}},
    'lb-t': {scalar:0.373242,units:{kg:1}},
    'oz': {scalar:0.0283495,units:{kg:1}},
    'oz-t': {scalar:0.0311035,units:{kg:1}},
    'cwt': {scalar:50.8023,units:{kg:1}},
    //electric
    'V': {scalar:1,units:{kg:1,m:2,s:-3,A:-1}},
    'Ω': {scalar:1,units:{kg:1,m:2,s:-3,A:-2}},
    'ohm': {scalar:1,units:{kg:1,m:2,s:-3,A:-2},alt:{'Ω':1}},
    'T': {scalar:1,units:{kg:1,s:-2,A:-1}},
    'Wb': {scalar:1,units:{kg:1,m:2,s:-2,A:-1}},
    //temperature
    '°R': {scalar:5/9,units:{K:1}},
    //light/luminosity
    'lm': {scalar:1/(4*Math.PI),units:{cd:1}}, //luminous flux; lumen
    'lx': {scalar:Math.PI,units:{cd:1,m:-2}}, //illuminance
    'nit': {scalar:1,units:{cd:1,m:-2}}, //luminance, nit
    //angle
    '°': {scalar:Math.PI/180,units:{rad:1}},
    'deg': {scalar:Math.PI/180,units:{rad:1},alt:{'°':1}},
    'rev': {scalar:2*Math.PI,units:{rad:1}},
    'rpm': {scalar:0.1047,units:{rad:1,s:-1},alt:{'rev':1,'min':-1}},
  
    // ~ UNIT/UNIT ~
  
    //velocity
    'kph': {scalar:0.27778,units:{m:1,s:-1},alt:{'km':1,'hr':-1}},
    'mph': {scalar:0.44704,units:{m:1,s:-1},alt:{'mi':1,'hr':-1}},
    'knot': {scalar:0.514446,units:{m:1,s:-1},alt:{'nmi':1,'hr':-1}},
    
    // ~ UNIT*UNIT ~
    
    //area
    'ha': {scalar:1e4,units:{m:2}},
    'ac': {scalar:4_046.8564224,units:{m:2},alt:{'acre':1}},
    'acre': {scalar:4_046.8564224,units:{m:2}},
    //volume - metric
    'fL': {scalar:1e-18,units:{m:3}},
    'pL': {scalar:1e-15,units:{m:3}},
    'nL': {scalar:1e-12,units:{m:3}},
    'μL': {scalar:1e-9,units:{m:3}},
    'mL': {scalar:1e-6,units:{m:3}},
    'cL': {scalar:1e-5,units:{m:3}},
    'dL': {scalar:1e-4,units:{m:3}},
    'L': {scalar:1e-3,units:{m:3}},
    'daL': {scalar:1e-2,units:{m:3}},
    'hL': {scalar:1e-1,units:{m:3}},
    'kL': {scalar:1,units:{m:3}},
    'ML': {scalar:1e3,units:{m:3}},
    'GL': {scalar:1e6,units:{m:3}},
    'TL': {scalar:1e9,units:{m:3}},
    'PL': {scalar:1e12,units:{m:3}},
    //volume - imperial
    'tsp': {scalar:0.00492892*1e-3,units:{m:3}},
    'tbsp': {scalar:0.0147868*1e-3,units:{m:3}},
    'fl-oz': {scalar:0.0295735*1e-3,units:{m:3}},
    'cup': {scalar:0.236588*1e-3,units:{m:3}},
    'pt': {scalar:0.473176*1e-3,units:{m:3}},
    'pint': {scalar:0.473176*1e-3,units:{m:3},alt:{'pt':1}},
    'qt': {scalar:0.946353*1e-3,units:{m:3}},
    'gal': {scalar:3.78541*1e-3,units:{m:3}},
    'bbl': {scalar:158.987*1e-3,units:{m:3}},
    'bu': {scalar:0.0352391,units:{m:3},alt:{'bsh':1}},
    'bsh': {scalar:0.0352391,units:{m:3}},
    //physics - metric
    'N': {scalar:1,units:{kg:1,m:1,s:-2}},
    'kN': {scalar:1e3,units:{kg:1,m:1,s:-2}},
    'J': {scalar:1,units:{kg:1,m:2,s:-2}},
    'kJ': {scalar:1e3,units:{kg:1,m:2,s:-2}},
    'mW': {scalar:1e-3,units:{kg:1,m:2,s:-3}},
    'W': {scalar:1,units:{kg:1,m:2,s:-3}},
    'kW': {scalar:1e3,units:{kg:1,m:2,s:-3}},
    'Hz': {scalar:1,units:{s:-1}},
    'c': {scalar:299_792_458,units:{m:1,s:-1}},
    'G': {scalar:9.80665,units:{m:1,s:-2}},
    //physics - imperial
    'BTU': {scalar:1055.06,units:{kg:1,m:2,s:-2}},
    'lbf': {scalar:4.44822,units:{kg:1,m:1,s:-2}},
    'ft-lb': {scalar:1.35582,units:{kg:1,m:2,s:-2},alt:{'ft-lbf':1}},
    'ft-lbf': {scalar:1.35582,units:{kg:1,m:2,s:-2}},
    //fuel economy
    'mpg': {scalar:425_144.0393,units:{m:-2}},
    'L/100km': {scalar:1e-3,units:{m:2}},
    //information
    'bit': {scalar:0.125,units:{byte:1}},
    'KB': {scalar:1e3,units:{byte:1}},
    'MB': {scalar:1e6,units:{byte:1}},
    'GB': {scalar:1e9,units:{byte:1}},
    'TB': {scalar:1e12,units:{byte:1}},
    'PB': {scalar:1e15,units:{byte:1}},
    'KiB': {scalar:1024,units:{byte:1}},
    'MiB': {scalar:1024**2,units:{byte:1}},
    'GiB': {scalar:1024**3,units:{byte:1}},
    'TiB': {scalar:1024**4,units:{byte:1}},
    'PiB': {scalar:1024**5,units:{byte:1}},
    //misc
    'Nm': {scalar:1,units:{kg:1,m:2,s:-2}},
    'Wh': {scalar:3600,units:{kg:1,m:2,s:-2}},
    'kWh': {scalar:3_600_000,units:{kg:1,m:2,s:-2}},
    'eV': {scalar:1.60218e-19,units:{kg:1,m:2,s:-2}},
    'Ah': {scalar:1/3600,units:{A:1,s:-1}},
    'mAh': {scalar:1/3_600_000,units:{A:1,s:-1}},
  } as const;
  private static readonly temperatureConversionTable: Record<string,IUnitValue2 & {units:{K:1},offset:number,alt?:Record<string,number>}> = {
    '°C': {scalar:1,offset:273.15,units:{K:1}},
    '°F': {scalar:5/9,offset:255.37222,units:{K:1}},
  } as const;
  
  private readonly origValue: {readonly scalar:number,readonly units:Readonly<Record<string,number>>};
  private readonly measType: MeasurementType;

  private constructor(index: number,line: CodeLine,siValue: IMeasurementValue,origValue: {scalar:number,units:Record<string,number>},text: string,name?: string) {
    super(index,line,siValue,text,'meas',name);
    this.origValue = origValue;
    this.measType = Measurement.categorizeDimension(this.value.units);
  }

  public static Build(index: number,line: CodeLine,scalar: number,units: StringValue,text: string,name?: string): Measurement | CompilationError {
    const unitDict = Measurement.unitSplit(units.rawValue);
    if (unitDict == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,units,units,'Meas.Build unit parse');
    }
    const siValue = this.convert(scalar,unitDict,'si') as IMeasurementValue | null;
    if (siValue == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,units,units,'Meas.Build to SI');
    }
    return new Measurement(index,line,siValue,{scalar,units:unitDict},text,name);
  }

  public static add(a: Measurement,b: Measurement,sign: 1 | -1,line: CodeLine): Measurement | CompilationError {
    if (!Measurement.sameDimensionAs(a.value.units,b.value.units)) {
      return new CompilationError(ErrorName.Blank,[a,b],`Cannot ${sign==1?'add':'subtract'} measurement of type ${a.measType} ${sign==1?'to':'from'} measurement of type ${b.measType}`,'Meas.add non-matching');
    }
    const siAdded: IMeasurementValue = {scalar:a.value.scalar+sign*b.value.scalar,units:a.value.units};
    const exactSameUnits = dictEqual(a.origValue.units,b.origValue.units,0);
    const displayValue = exactSameUnits?Measurement.convert(siAdded.scalar,siAdded.units,a.origValue.units):siAdded;
    if (displayValue == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,[a,b],[a,b],'Meas.add non-parse');
    }
    return new Measurement(-1,line,siAdded,displayValue,'');
  }
  public static multiply(a: Measurement,b: Measurement,sign: 1 | -1,line: CodeLine): Measurement | CompilationError {
    const siProductUnits: SIDict = {};
    for (const siUnitName of keys(a.value.units)) {
      siProductUnits[siUnitName] = (siProductUnits[siUnitName] ?? 0) + a.value.units[siUnitName]!;
    }
    for (const siUnitName of keys(b.value.units)) {
      siProductUnits[siUnitName] = (siProductUnits[siUnitName] ?? 0) + sign * b.value.units[siUnitName]!;
    }
    const origProductUnits: Record<string,number> = {};
    for (const unitName in a.origValue.units) {
      origProductUnits[unitName] = (origProductUnits[unitName] ?? 0) + a.origValue.units[unitName];
    }
    for (const unitName in b.origValue.units) {
      origProductUnits[unitName] = (origProductUnits[unitName] ?? 0) + sign * b.origValue.units[unitName];
    }

    const siProduct: IMeasurementValue = {scalar:
      sign==1?a.value.scalar*b.value.scalar:a.value.scalar/b.value.scalar,
      units:siProductUnits
    };
    const displayValue = Measurement.convert(siProduct.scalar,siProduct.units,origProductUnits);
    if (displayValue == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,[a,b],[a,b],'Meas.multiply non-parse');
    }
    return new Measurement(-1,line,siProduct,displayValue,'');
  }
  public static scale(m: Measurement,k: NumberValue,line: CodeLine): Measurement | CompilationError {
    const siProduct: IMeasurementValue = {scalar:m.value.scalar**k.value,units:m.value.units};
    const displayValue = Measurement.convert(siProduct.scalar,siProduct.units,m.origValue.units);
    if (displayValue == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,[m,k],[m,k],'Meas.scale non-parse');
    }
    return new Measurement(-1,line,siProduct,displayValue,'');
  }
  public static raise(m: Measurement,k: NumberValue,line: CodeLine): Measurement | CompilationError {
    const siRaisedUnits: SIDict = {};
    for (const siUnitName of keys(m.value.units)) {
      siRaisedUnits[siUnitName] = (siRaisedUnits[siUnitName] ?? 0) + k.value * m.value.units[siUnitName]!;
    }
    const origRaisedUnits: Record<string,number> = {};
    for (const unitName in m.origValue.units) {
      origRaisedUnits[unitName] = (origRaisedUnits[unitName] ?? 0) + k.value * m.origValue.units[unitName]!;
    }

    const siProduct: IMeasurementValue = {scalar:m.value.scalar**k.value,units:siRaisedUnits};
    const displayValue = Measurement.convert(siProduct.scalar,siProduct.units,origRaisedUnits);
    if (displayValue == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,[m,k],[m,k],'Meas.raise non-parse');
    }
    return new Measurement(-1,line,siProduct,displayValue,'');
  }
  public static reciprocal(k: NumberValue,m: Measurement,line: CodeLine): Measurement | CompilationError {
    const siFlippedUnits: SIDict = {};
    for (const siUnitName of keys(m.value.units)) {
      siFlippedUnits[siUnitName] = (siFlippedUnits[siUnitName] ?? 0) - m.value.units[siUnitName]!;
    }
    const origFlippedUnits: Record<string,number> = {};
    for (const unitName in m.origValue.units) {
      origFlippedUnits[unitName] = (origFlippedUnits[unitName] ?? 0) - m.origValue.units[unitName]!;
    }

    const siProduct: IMeasurementValue = {scalar:k.value/m.value.scalar,units:siFlippedUnits};
    const displayValue = Measurement.convert(siProduct.scalar,siProduct.units,origFlippedUnits);
    if (displayValue == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,[m,k],[m,k],'Meas.reciprocal non-parse');
    }
    return new Measurement(-1,line,siProduct,displayValue,'');
  }

  public static sameDimensionAs(siDictA: SIDict,siDictB: SIDict): boolean {
    for (const siUnit of Measurement.siUnits) { //check for same dimensions
      if ((siDictA[siUnit] ?? 0) != (siDictB[siUnit] ?? 0)) {
        return false;
      }
    }
    return true;
  }
  public static isSIUnit(unit: string): unit is SIUnit {
    return (Measurement.siUnits as ReadonlyArray<string>).includes(unit);
  }
  public static cleanUnits(dict: Record<string,number>): Record<string,number> | null {
    const unitDict = structuredClone(dict);
    if ('°F' in dict && dict['°F'] != 1 && dict['°F'] != 0) {
      return null;
    }
    if ('°C' in dict && dict['°C'] != 1 && dict['°C'] != 0) {
      return null;
    }
    // if ('F' in unitDict) {
    //   unitDict['°F'] = (unitDict['°F'] ?? 0) + unitDict['F'];
    //   delete unitDict['F'];
    // }
    // if ('C' in unitDict) {
    //   unitDict['°C'] = (unitDict['°C'] ?? 0) + unitDict['C'];
    //   delete unitDict['C'];
    // }
    for (const unitName in unitDict) {
      console.log('unitName',unitName);
      if (Measurement.siUnits.includes(unitName as 'm')) {
        continue;
      }
      if (unitName == '°F' || unitName == '°C') {
        continue;
      }
      if (!(unitName in Measurement.conversionTable) && !(unitName in Measurement.temperatureConversionTable)) {
        return null;
      }
      if (Measurement.conversionTable[unitName].alt) {
        for (const altName in Measurement.conversionTable[unitName].alt) {
          unitDict[altName] = (unitDict[altName] ?? 0) + Measurement.conversionTable[unitName].alt![altName] * unitDict[unitName];
        }
        delete unitDict[unitName];
      }
    }
    return unitDict;
  }
  public static toSIUnits(dict: Record<string,number>): SIDict | null {
    const siDict: SIDict = {};
    if ('°F' in dict && dict['°F'] != 1 && dict['°F'] != 0) {
      return null;
    }
    if ('°C' in dict && dict['°C'] != 1 && dict['°C'] != 0) {
      return null;
    }
    for (const unitName in dict) {
      if (Measurement.isSIUnit(unitName)) {
        siDict[unitName] = (siDict[unitName] ?? 0) + dict[unitName];
      } else if (unitName in Measurement.conversionTable) {
        for (const siUnitName of keys(Measurement.conversionTable[unitName].units)) {
          siDict[siUnitName] = (siDict[siUnitName] ?? 0) + Measurement.conversionTable[unitName].units[siUnitName]! * dict[unitName];
        }
      } else if (unitName in Measurement.temperatureConversionTable) {
        for (const siUnitName of keys(Measurement.temperatureConversionTable[unitName].units)) {
          siDict[siUnitName] = (siDict[siUnitName] ?? 0) + Measurement.temperatureConversionTable[unitName].units[siUnitName]! * dict[unitName];
        }
      } else {
        return null;
      }
    }
    return siDict;
  }
  public static convert(value: number,from: Record<string,number>,to: Record<string,number> | 'si'): {scalar:number,units:Record<string,number>} | null {
    const fromDict = Measurement.cleanUnits(from);
    const toDict = (to=='si'?Measurement.toSIUnits(from):Measurement.cleanUnits(to)) as Record<string,number> | null;
    if (fromDict == null || toDict == null) {
      console.error('no standardize',fromDict,toDict,from,to);
      return null;
    }
    const fromSIDict: SIDict = {};
    if ('°F' in fromDict) {
      value = value * Measurement.temperatureConversionTable['°F'].scalar + Measurement.temperatureConversionTable['°F'].offset;
      fromSIDict['K'] = (fromSIDict['K'] ?? 0) + 1;
    }
    if ('°C' in fromDict) {
      value = value * Measurement.temperatureConversionTable['°C'].scalar + Measurement.temperatureConversionTable['°C'].offset;
      fromSIDict['K'] = (fromSIDict['K'] ?? 0) + 1;
    }
    for (const unitName in fromDict) {
      if (Measurement.isSIUnit(unitName)) {
        fromSIDict[unitName] = (fromSIDict[unitName] ?? 0) + fromDict[unitName];
        continue;
      }
      if (unitName == '°F' || unitName == '°C') {
        continue;
      }
      const conversion = Measurement.conversionTable[unitName];
      if (conversion == undefined) {
        console.error('no conversion from',unitName);
        return null;
      }
      value *= conversion.scalar ** fromDict[unitName];
      for (const convName of keys(conversion.units)) {
        fromSIDict[convName] = (fromSIDict[convName] ?? 0) + fromDict[unitName] * conversion.units[convName]!;
      }
    }
    if (to == 'si') {
      return {scalar:value,units:toDict};
    }
    const toSIDict: SIDict = {};
    for (const unitName in toDict) {
      if (Measurement.isSIUnit(unitName)) {
        toSIDict[unitName] = (toSIDict[unitName] ?? 0) + toDict[unitName];
        continue;
      }
      if (unitName == '°F' || unitName == '°C') {
        continue;
      }
      const conversion = Measurement.conversionTable[unitName];
      if (conversion == undefined) {
        console.error('no conversion to',unitName);
        return null;
      }
      value /= conversion.scalar ** toDict[unitName];
      for (const convName of keys(conversion.units)) {
        toSIDict[convName] = (toSIDict[convName] ?? 0) + toDict[unitName] * conversion.units[convName]!;
      }
    }
    if ('°F' in toDict) {
      value = (value - Measurement.temperatureConversionTable['°F'].offset) / Measurement.temperatureConversionTable['°F'].scalar;
      toSIDict['K'] = (toSIDict['K'] ?? 0) + 1;
    }
    if ('°C' in toDict) {
      value = (value - Measurement.temperatureConversionTable['°C'].offset) / Measurement.temperatureConversionTable['°C'].scalar;
      toSIDict['K'] = (toSIDict['K'] ?? 0) + 1;
    }
    if (!Measurement.sameDimensionAs(fromSIDict,toSIDict)) {
      console.error('different dimensions',fromSIDict,toSIDict,from,to);
      return null;
    }
    
    return {scalar:value,units:toDict};
  }
  public static unitSplit(unitName: string,recurCall: boolean = false): Record<string,number> | null {
    const unitDict: Record<string,number> = {};
    let fractionSide = 1;
    let currentUnit = '';
    for (let i = 0; i <= unitName.length; i++) {
      if (unitName[i] == '(') {
        const end = unitName.substring(i).indexOf(')');
        if (end == -1) {
          return null;
        }
        const recurUnits = Measurement.unitSplit(unitName.slice(i+1,i+end),true);
        for (const unit in recurUnits) {
          unitDict[unit] = (unitDict[unit] ?? 0) + recurUnits[unit] * fractionSide;
        }
        i = end + i + 1;
      } else if (unitName[i] == ')') {
        return null;
      } else if (unitName[i] == '*' || unitName[i] == '/' || i == unitName.length) {
        const caretIndex = currentUnit.indexOf('^');
        if (caretIndex == -1) {
          unitDict[currentUnit] = (unitDict[currentUnit] ?? 0) + fractionSide;
        } else {
          const innerCaretIndex = currentUnit.substring(caretIndex+1).indexOf('^');
          if (innerCaretIndex != -1) {
            return null;
          }
          const exponent = Number(currentUnit.substring(caretIndex+1));
          if (isNaN(exponent)) {
            return null;
          }
          unitDict[currentUnit.substring(0,caretIndex)] = (unitDict[currentUnit.substring(0,caretIndex)] ?? 0) + exponent * fractionSide;
        }
        currentUnit = '';
        fractionSide = unitName[i]=='/'?-1:1;
      } else {
        currentUnit += unitName[i];
      }
    }
    return recurCall?unitDict:Measurement.cleanUnits(unitDict);
  }
  public static categorizeDimension(dim: SIDict): MeasurementType {
    function matches(ref: SIDict): boolean {
      for (const siUnitName of Measurement.siUnits) {
        if ((dim[siUnitName] ?? 0) != (ref[siUnitName] ?? 0)) {
          return false;
        }
      }
      return true;
    }
    if (matches({m:1})) {
      return 'length';
    } else if (matches({m:1,s:-1})) {
      return 'velocity';
    } else if (matches({m:1,s:-2})) {
      return 'acceleration';
    } else if (matches({m:1,s:-3})) {
      return 'jerk';
    } else if (matches({m:1,s:-4})) {
      return 'snap';
    } else if (matches({m:1,s:-5})) {
      return 'crackle';
    } else if (matches({m:1,s:-6})) {
      return 'pop';
    } else if (matches({kg:1})) {
      return 'mass';
    } else if (matches({kg:1,m:1,s:-1})) {
      return 'momentum';
    } else if (matches({kg:1,m:1,s:-2})) {
      return 'force';
    } else if (matches({kg:1,m:2,s:-2})) {
      return 'energy';
    } else if (matches({kg:1,m:2,s:-3})) {
      return 'power';
    } else if (matches({kg:1,m:2,s:-3,A:-2})) {
      return 'resistance';
    } else if (matches({kg:1,m:2,s:-3,A:-1})) {
      return 'electric potential';
    } else if (matches({kg:1,s:-2,A:-1})) {
      return 'magnetic flux density';
    } else if (matches({kg:1,m:2,s:-2,A:-1})) {
      return 'magnetic flux';
    } else if (matches({s:-1})) {
      return 'frequency';
    } else if (matches({kg:1,m:2})) {
      return 'inertia';
    } else if (matches({rad:1,s:-1})) {
      return 'radial velocity';
    } else if (matches({rad:1,s:-2})) {
      return 'radial acceleration';
    } else if (matches({byte:1})) {
      return 'information';
    } else if (matches({m:2})) {
      return 'area';
    } else if (matches({m:3})) {
      return 'volume';
    }
    return 'unknown';
  }
  public static siUnitCategory(measType: MeasurementType): SIUnit | SIAdjUnit | undefined {
    switch(measType) {
      case 'energy':
        return 'J';
      case 'force':
        return 'N';
      case 'length':
        return 'm';
      case 'mass':
        return 'kg';
      case 'power':
        return 'W';
      case 'electric potential':
        return 'V';
      case 'resistance':
        return 'Ω';
      case 'frequency':
        return 'Hz';
    }
  }

  public clone(index: number,text?: string,line?: CodeLine): Measurement {
    return new Measurement(index,line ?? this.line,this.value,this.origValue,text ?? this.text,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): Measurement {
    return new Measurement(index,line,this.value,this.origValue,name,name);
  }
  public equals(other: AbstractSymbol,withReference?: boolean): boolean {
    if (!(other instanceof Measurement)) { return false; }
    if (withReference) { return this.name == other.name; }
    if (Math.abs(this.value.scalar - other.value.scalar) > SuperMath.EPSILON) {
      return false;
    }
    return Measurement.sameDimensionAs(this.value.units,other.value.units);
  }
  get preview(): string {
    let val = SuperMath.renderNumber(this.origValue.scalar,5).replace('...','');
    return val + ' ' + this.unitAsString;
  }
  get unitAsString(): string {
    const parsedUnits: string[] = []
    for (const unitName in this.origValue.units) {
      if (this.origValue.units[unitName] == 0) {
        continue;
      }
      const exponent = this.origValue.units[unitName];
      if (exponent == 1) {
        parsedUnits.push(unitName);
      } else {
        parsedUnits.push(unitName + '^' + this.origValue.units[unitName]);
      }
    }
    let siOnly = true;
    for (const unitName in this.origValue.units) {
      if (!Measurement.siUnits.includes(unitName as 'm') && !Measurement.siAdjUnits.includes(unitName as 'V')) {
        siOnly = false;
        break;
      }
    }
    return (siOnly?Measurement.siUnitCategory(this.measType):undefined) ?? parsedUnits.join('*');
  }

  get propertyNames(): string[] {
    return ['si','value','type'];
  }
  public getNamedProperty(index: string | AbstractSymbol,line: CodeLine): AbstractStorable | CompilationError {
    const name = KeyableSymbol.getPropName(index);
    if (name == 'si') {
      return new Measurement(-1,line,this.value,this.value,'');
    }
    if (name == 'value') {
      return new NumberValue(-1,line,this.origValue.scalar,'');
    }
    if (name == 'type') {
      return new StringValue(-1,line,this.measType,'');
    }
    return new CompilationError(ErrorName.SIndex_Invalid,undefined,index,'Meas.getProp');
  }
}
class MeasurementInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'meas','Constructs a new measurement object',[
      {name:'value',types:['num'],desc:'The measurement value'},
      {name:'units',types:['str'],desc:'The measurement units'},
    ],[{type:'meas'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const meas = Measurement.Build(-1,this.line,params.map.value.castTo('num').value,params.map.units.castTo('str'),'');
    if (meas instanceof CompilationError) {
      return meas;
    }
    return {value:meas,warnings:params.warnings};
  }
}
class MeasurementConverter extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'convert','Converts a measurement object to a different unit',[
      {name:'value',types:['meas'],desc:'The measurement to convert'},
      {name:'units',types:['str'],desc:'The units to which to convert'}
    ],[{type:'meas'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const meas = params.map.value.castTo('meas');
    const units = Measurement.unitSplit(params.map.units.castTo('str').rawValue);
    if (units == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,params.map.units,params.map.units,'MeasConv.operate non parse');
    }
    const convertedValue = Measurement.convert(meas.value.scalar,meas.value.units,units);
    if (convertedValue == null) {
      return new CompilationError(ErrorName.Measurement_NonParse,params.map.units,params.map.units,'MeasConv.operate non convert');
    }
    const convertedMeas = Measurement.Build(-1,this.line,convertedValue.scalar,params.map.units.castTo('str'),'');
    if (convertedMeas instanceof CompilationError) {
      return convertedMeas;
    }
    return {value:convertedMeas,warnings:params.warnings};
  }
}

// ~ STAT TESTS ~

type TestStatistic = 't' | 'z' | 'chisq' | 'F';
type StatTestValue = {
  readonly pValue: number;
  readonly testStat: number;
  readonly rejected: boolean;
  readonly dof: number;
} & ({readonly testType: 't'|'z',readonly value: number,readonly interval:{
  readonly lower: number;
  readonly upper: number;
}} | {readonly testType:'chisq'|'F'});
class StatTestResult extends KeyableSymbol<StatTestValue> {
  public constructor(index: number,line: CodeLine,value: StatTestValue,text: string,name?: string) {
    super(index,line,value,text,'test',name);
  }

  public static checkParameters(paramResult: IFunctionNamedParam): IFunctionNamedParam | CompilationError {
    if (paramResult.map.alpha) {
      const alpha = paramResult.map.alpha.castTo('num').value;
      if (alpha < 0 || alpha > 1) {
        return new CompilationError(ErrorName.StatTest_InvalidAlpha,paramResult.map.alpha,paramResult.map.alpha,'StatTestRes.checkParam alpha check');
      }
    }
    if (paramResult.map.alt && !['~=','>','<'].includes(paramResult.map.alt.value as string)) {
      return new CompilationError(ErrorName.StatTest_InvalidAlternative,paramResult.map.alt,paramResult.map.alt,'StatTestRes.checkParam alt check');
    }
    return paramResult;
  }

  public clone(index: number,text?: string,line?: CodeLine): StatTestResult {
    return new StatTestResult(index,line ?? this.line,this.value,text ?? this.text,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): StatTestResult {
    return new StatTestResult(index,line,this.value,name,name);
  }
  public equals(other: AbstractSymbol,withReference?: boolean): boolean {
    if (!(other instanceof StatTestResult)) { return false; }
    if (withReference) { return this.name == other.name; }
    return this.value.testType == other.value.testType && this.value.pValue == other.value.pValue &&
      this.value.rejected == other.value.rejected && this.value.testStat == other.value.testStat;
  }
  get preview(): string {
    const r = (n: number) => SuperMath.renderNumber(n,5).replace('...','');
    if (this.value.testType == 't' || this.value.testType == 'z') {
      return `${this.value.testType}-test: rejected=${this.value.rejected}, test=${r(this.value.testStat)}, p=${r(this.value.pValue)}, interval=[${r(this.value.interval.lower)},${r(this.value.interval.upper)}], dof=${r(this.value.dof)}`;
    }
    if (this.value.testType == 'chisq') {
      return `${this.value.testType}-test: rejected=${this.value.rejected}, test=${r(this.value.testStat)}, p=${r(this.value.pValue)}, dof=${r(this.value.dof)}`;
    }
    if (this.value.testType == 'F') {
      return `${this.value.testType}-test: rejected=${this.value.rejected}, test=${r(this.value.testStat)}, p=${r(this.value.pValue)}`;
    }
    return '';
  }

  get propertyNames(): (string|undefined)[] {
    return [this.value.testType,'interval' in this.value?'interval':undefined,'rejected','p_value','dof'];
  }
  public getNamedProperty(index: string | AbstractSymbol,line: CodeLine): AbstractStorable | CompilationError {
    const name = KeyableSymbol.getPropName(index);
    if (name == this.value.testType) {
      return new NumberValue(-1,this.line,this.value.testStat,'');
    }
    if (name == 'interval' && (this.value.testType == 't' || this.value.testType == 'z')) {
      return new NumberVector(-1,this.line,[
        new NumberValue(-1,this.line,this.value.interval.lower,''),
        new NumberValue(-1,this.line,this.value.interval.upper,''),
      ],'');
    }
    if (name == 'p_value') {
      return new NumberValue(-1,this.line,this.value.pValue,'');
    }
    if (name == 'dof') {
      return new NumberValue(-1,this.line,this.value.dof,'');
    }
    return new CompilationError(ErrorName.SIndex_Invalid,undefined,index,'StatTestResult.getProp');
  }
}
class OneSampleStatTest extends BuiltInFunction {
  private readonly testStat: TestStatistic;

  public constructor(index: number,line: CodeLine,name: 'ttest'|'ztest') {
    const params: FunctionParam[] = [
      {name:'sample',types:['nvec'],desc:'The sample against which to test'},
      {name:'alt',types:['operator'],desc:'The sign of the alternative hypothesis'},
      {name:'val',types:['num'],desc:'The value in the alternative hypothesis'},
      {name:'alpha',types:['num'],desc:'The significance level of the test',optional:true,default:'5%'}
    ];
    if (name == 'ztest') {
      params.splice(3,0,{name:'sigma',types:['num'],desc:'The population standard deviation'});
    }
    super(index,line,name,'Tests the mean value of a sample',params,[{type:'test'}]);
    this.testStat = name == 'ttest' ? 't' : 'z';
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const check = StatTestResult.checkParameters(params);
    if (check instanceof CompilationError) {
      return check;
    }
    const alpha = params.map.alpha?.castTo('num').value ?? 0.05;
    const sample = params.map.sample.castTo('nvec').asNumberArray;
    if (sample.length < 2) {
      return new CompilationError(ErrorName.StatTest_TooLittleData,params.map.sample,params.map.sample,'OSTest.operate too little data');
    }
    const sx = (params.map.sigma?.castTo('num').value ?? SuperMath.sampleStd(sample)) / Math.sqrt(sample.length);
    if (Math.abs(sx) < Number.EPSILON) {
      return new CompilationError(ErrorName.StatTest_ZeroSD,params.map.sample,params.map.sample,'OSTest.operate zero sd');
    }
    const sampleMean = SuperMath.mean(sample);
    const val = params.map.val.castTo('num').value;
    let intervalLower: number;
    let intervalUpper: number;
    let pValue: number;
    const alt = params.map.alt.value;
    const dof = this.testStat=='t' ? sample.length - 1 : Infinity;
    const testStat = (sampleMean - val) / sx;
    const basePValue = this.testStat=='t' ? jStat.studentt.cdf(testStat,dof) : jStat.normal.cdf(testStat,0,1);
    if (alt == '~=') {
      const z = this.testStat=='t' ? jStat.studentt.inv(1-alpha/2,dof) : jStat.normal.inv(1-alpha/2,0,1);
      intervalLower = sampleMean - z * sx;
      intervalUpper = sampleMean + z * sx;
      pValue = testStat<0 ? basePValue * 2 : (1-basePValue) * 2;
    } else {
      const z = this.testStat=='t' ? jStat.studentt.inv(1-alpha,dof) : jStat.normal.inv(1-alpha,0,1);
      if (alt == '>') {
        intervalLower = sampleMean - z * sx;
        intervalUpper = Infinity;
        pValue = 1 - basePValue;
      } else {
        intervalLower = -Infinity;
        intervalUpper = sampleMean + z * sx;
        pValue = basePValue;
      }
    }
    return {value:new StatTestResult(-1,this.line,{
      interval: {lower:intervalLower,upper:intervalUpper},
      testStat: testStat,
      testType: this.testStat,
      dof: dof,
      pValue: pValue,
      rejected: val < intervalLower || val > intervalUpper,
      value: sampleMean
    },''),warnings:params.warnings};
  }
}
class TwoSampleStatTest extends BuiltInFunction {
  private readonly testStat: TestStatistic;

  public constructor(index: number,line: CodeLine,name: 'ttest2'|'ztest2') {
    const params: FunctionParam[] = [
      {name:'sample1',types:['nvec'],desc:'The sample against which to test'},
      {name:'sample2',types:['nvec'],desc:'The sample against which to test'},
      {name:'alt',types:['operator'],desc:'The sign of the alternative hypothesis',optional:true,default:'~='},
      {name:'val',types:['num'],desc:'The sign of the alternative hypothesis',optional:true,default:'0'},
      {name:'alpha',types:['num'],desc:'The significance level of the test',optional:true,default:'5%'}
    ];
    if (name == 'ztest2') {
      params.splice(2,0,
        {name:'sigma1',types:['num'],desc:'The population standard deviation'},
        {name:'sigma2',types:['num'],desc:'The population standard deviation'},
      );
    } else {
      params.push({name:'type',types:['num'],desc:'0=Welch\'s,1=Pooled,2=Student\'s',optional:true,default:'Welch\'s'});
    }
    super(index,line,name,'Tests the mean value of a sample',params,[{type:'test'}]);
    this.testStat = name == 'ttest2' ? 't' : 'z';
  }

  private static welchDOF(sx1: number,sx2: number,n1: number,n2: number): number {
    const num = (sx1 ** 2 / n1 + sx2 ** 2 / n2) ** 2;
    const A = 1 / (n1 - 1);
    const B = (sx1 ** 2 / n1) ** 2;
    const C = 1 / (n2 - 1);
    const D = (sx2 ** 2 / n2) ** 2;
    const den = A*B + C*D;
    return num / den;
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const check = StatTestResult.checkParameters(params);
    if (check instanceof CompilationError) {
      return check;
    }
    const alpha = params.map.alpha?.castTo('num').value ?? 0.05;
    const sample1 = params.map.sample1.castTo('nvec').asNumberArray;
    const sample2 = params.map.sample2.castTo('nvec').asNumberArray;
    if (sample1.length < 2) {
      return new CompilationError(ErrorName.StatTest_TooLittleData,params.map.sample1,params.map.sample1,'TS.operate too little s1');
    }
    if (sample2.length < 2) {
      return new CompilationError(ErrorName.StatTest_TooLittleData,params.map.sample2,params.map.sample2,'TS.operate too little s2');
    }
    const type = params.map.type?.castTo('num').value ?? 0;
    const sampleMean = SuperMath.mean(sample1) - SuperMath.mean(sample2);
    const val = params.map.val?.castTo('num').value ?? 0;
    const sx1 = params.map.sigma1?.castTo('num').value ?? SuperMath.sampleStd(sample1);
    const sx2 = params.map.sigma2?.castTo('num').value ?? SuperMath.sampleStd(sample2);
    const alt = params.map.alt?.value ?? '~=';
    const sx = type == 1 ?
      Math.sqrt( ((sample1.length - 1) * sx1 ** 2 + (sample2.length - 1) * sx2 ** 2) / (sample1.length - sample2.length - 2) ) :
      Math.sqrt( sx1 ** 2 / sample1.length + sx2 ** 2 / sample2.length );
    const dof = this.testStat == 'z' ? Infinity : type != 0 ? sample1.length + sample2.length - 2 :
      TwoSampleStatTest.welchDOF(sx1,sx2,sample1.length,sample2.length);
    const testStat = (sampleMean - val) / sx;
    let intervalLower: number;
    let intervalUpper: number;
    let pValue: number;
    const basePValue = this.testStat=='t' ? jStat.studentt.cdf(testStat,dof) : jStat.normal.cdf(testStat,0,1);
    if (alt == '~=') {
      const z = this.testStat=='t' ? jStat.studentt.inv(1-alpha/2,dof) : jStat.normal.inv(1-alpha/2,0,1);
      intervalLower = sampleMean - z * sx;
      intervalUpper = sampleMean + z * sx;
      pValue = testStat<0 ? basePValue * 2 : (1-basePValue) * 2;
    } else {
      const z = this.testStat=='t' ? jStat.studentt.inv(1-alpha,dof) : jStat.normal.inv(1-alpha,0,1);
      if (alt == '>') {
        intervalLower = sampleMean - z * sx;
        intervalUpper = Infinity;
        pValue = 1 - basePValue;
      } else {
        intervalLower = -Infinity;
        intervalUpper = sampleMean + z * sx;
        pValue = basePValue;
      }
    }
    return {value:new StatTestResult(-1,this.line,{
      interval: {lower:intervalLower,upper:intervalUpper},
      testStat: testStat,
      testType: this.testStat,
      dof: dof,
      pValue: pValue,
      rejected: val < intervalLower || val > intervalUpper,
      value: sampleMean
    },''),warnings:params.warnings};
  }

  get propertyNames(): (string | undefined)[] | undefined {
    return this.text=='ttest2'?['welch','pooled','student']:undefined;
  }
  public getNamedProperty(index: AbstractSymbol): CompilationError | AbstractStorable {
    if (this.text == 'ttest2') {
      const name = KeyableSymbol.getPropName(index);
      if (name == 'welch') {
        return new NumberValue(-1,this.line,0,'');
      } else if (name == 'pooled') {
        return new NumberValue(-1,this.line,1,'');
      } else if (name == 'student') {
        return new NumberValue(-1,this.line,2,'');
      }
    }
    return super.getNamedProperty(index);
  }
}
class PairedStatTest extends BuiltInFunction {
  private readonly testStat: TestStatistic;

  public constructor(index: number,line: CodeLine,name: 'pttest'|'pztest') {
    const params: FunctionParam[] = [
      {name:'sample1',types:['nvec'],desc:'The sample against which to test'},
      {name:'sample2',types:['nvec'],desc:'The sample against which to test'},
      {name:'alt',types:['operator'],desc:'The sign of the alternative hypothesis'},
      {name:'val',types:['num'],desc:'The expected mean of differences'},
      {name:'alpha',types:['num'],desc:'The significance level of the test',optional:true,default:'5%'}
    ];
    if (name == 'pztest') {
      params.splice(4,0,{name:'sigma',types:['num'],desc:'The population standard deviation of differences'});
    }
    super(index,line,name,'Tests against the difference in two paired samples',params,[{type:'test'}]);
    this.testStat = name=='pttest'?'t':'z';
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const check = StatTestResult.checkParameters(params);
    if (check instanceof CompilationError) {
      return check;
    }
    const sample1 = params.map.sample1.castTo('nvec').asNumberArray;
    const sample2 = params.map.sample2.castTo('nvec').asNumberArray;
    if (sample1.length != sample2.length) {
      const report = [params.map.sample1,params.map.sample2];
      return new CompilationError(ErrorName.StatTest_UnequalPairedSize,report,report,'PairedTest.operate uneven');
    }
    if (sample1.length < 2) {
      const report = [params.map.sample1,params.map.sample2];
      return new CompilationError(ErrorName.StatTest_TooLittleData,report,report,'PairedTest.operate too little data');
    }
    const differences: number[] = [];
    for (let i = 0; i < sample1.length; i++) {
      differences.push(sample1[i] - sample2[i]);
    }
    const sx = (params.map.sigma?.castTo('num').value ?? SuperMath.sampleStd(differences)) / Math.sqrt(sample1.length);
    if (Math.abs(sx) < Number.EPSILON) {
      const report = [params.map.sample1,params.map.sample2];
      return new CompilationError(ErrorName.StatTest_ZeroSD,report,report,'PTest.operate zero sd');
    }
    const meanOfDifferences = SuperMath.mean(differences);
    const val = params.map.val.castTo('num').value;
    const testStat = (meanOfDifferences - val) / sx;
    const alt = params.map.alt.value;
    const dof = this.testStat=='t' ? sample1.length - 1 : Infinity;
    const alpha = params.map.alpha?.castTo('num').value ?? 0.05;
    const basePValue = this.testStat=='t' ? jStat.studentt.cdf(testStat,dof) : jStat.normal.cdf(testStat,0,1);
    let intervalLower: number;
    let intervalUpper: number;
    let pValue: number;
    if (alt == '~=') {
      const z = this.testStat=='t' ? jStat.studentt.inv(1-alpha/2,dof) : jStat.normal.inv(1-alpha/2,0,1);
      intervalLower = meanOfDifferences - z * sx;
      intervalUpper = meanOfDifferences + z * sx;
      pValue = testStat<0 ? basePValue * 2 : (1-basePValue) * 2;
    } else {
      const z = this.testStat=='t' ? jStat.studentt.inv(1-alpha,dof) : jStat.normal.inv(1-alpha,0,1);
      if (alt == '>') {
        intervalLower = meanOfDifferences - z * sx;
        intervalUpper = Infinity;
        pValue = 1 - basePValue;
      } else {
        intervalLower = -Infinity;
        intervalUpper = meanOfDifferences + z * sx;
        pValue = basePValue;
      }
    }
    return {value:new StatTestResult(-1,this.line,{
      interval: {lower:intervalLower,upper:intervalUpper},
      pValue: pValue,
      value: meanOfDifferences,
      testType: this.testStat,
      dof: dof,
      testStat: testStat,
      rejected: testStat < intervalLower || testStat > intervalUpper
    },''),warnings:params.warnings};
  }
}
class PropStatTest extends BuiltInFunction {
  public constructor(index: number,line: CodeLine,name: 'propztest'|'propztest2') {
    const params: FunctionParam[] = name=='propztest'?[
      {name:'p0',types:['num'],desc:'Expected proportion'},
      {name:'x',types:['num'],desc:'Numerator of sample'},
      {name:'n',types:['num'],desc:'Denominator of sample'},
    ]:[
      {name:'x1',types:['num'],desc:'Numerator of sample 1'},
      {name:'n1',types:['num'],desc:'Denominator of sample 1'},
      {name:'x2',types:['num'],desc:'Numerator of sample 2'},
      {name:'n2',types:['num'],desc:'Denominator of sample 2'},
    ];
    super(index,line,name,'Tests whether a proportion matches a sample',params.concat([
      {name:'alt',types:['operator'],desc:'The sign of the alternative hypothesis',optional:true,default:'~='},
      {name:'val',types:['num'],desc:'The difference in proportions',optional:true,default:'0'},
      {name:'alpha',types:['num'],desc:'The significance level of the test',optional:true,default:'5%'}
    ]),[{type:'test'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const check = StatTestResult.checkParameters(params);
    if (check instanceof CompilationError) {
      return check;
    }
    let p1: number;
    let p2: number;
    let sx: number;
    let sampleProportion: number;
    if (params.map.n && params.map.x) {
      const x = params.map.x.castTo('num').value;
      const n = params.map.n.castTo('num').value;
      p1 = x / n; //p
      sampleProportion = x / n;
      p2 = params.map.p0.castTo('num').value; //p0
      sx = Math.sqrt(p2 * (1 - p2) / n);
    } else {
      const x1 = params.map.x1.castTo('num').value;
      const x2 = params.map.x2.castTo('num').value;
      const n1 = params.map.n1.castTo('num').value;
      const n2 = params.map.n2.castTo('num').value;
      p1 = x1 / n1;
      p2 = x2 / n2;
      sampleProportion = (x1 + x2) / (n1 + n2);
      sx = Math.sqrt(sampleProportion * (1 - sampleProportion) * (1 / n1 + 1 / n2));
    }
    const val = params.map.val?.castTo('num').value ?? 0;
    const testStat = (p1 - p2 - val) / sx;
    const alpha = params.map.alpha?.castTo('num').value ?? 0.05;
    const alt = params.map.alt?.value ?? '~=';
    const basePValue = jStat.normal.cdf(testStat,0,1);
    let intervalLower: number;
    let intervalUpper: number;
    let pValue: number;
    if (alt == '~=') {
      const z = jStat.normal.inv(1-alpha/2,0,1);
      intervalLower = sampleProportion - z * sx;
      intervalUpper = sampleProportion + z * sx;
      pValue = testStat<0 ? basePValue * 2 : (1-basePValue) * 2;
    } else {
      const z = jStat.normal.inv(1-alpha,0,1);
      if (alt == '>') {
        intervalLower = sampleProportion - z * sx;
        intervalUpper = Infinity;
        pValue = 1 - basePValue;
      } else {
        intervalLower = -Infinity;
        intervalUpper = sampleProportion + z * sx;
        pValue = basePValue;
      }
    }
    return {value:new StatTestResult(-1,this.line,{
      interval: {lower:intervalLower,upper:intervalUpper},
      pValue: pValue,
      value: sampleProportion,
      testType: 'z',
      dof: Infinity,
      testStat: testStat,
      rejected: testStat < intervalLower || testStat > intervalUpper
    },''),warnings:params.warnings};
  }
}
class IndependenceTest extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'indtest','Tests for independence in a table',[
      {name:'values',types:['nmtx'],desc:'The values to test for independence'},
      {name:'alpha',types:['num'],desc:'The significance level of the test',optional:true,default:'0.05'},
    ],[{type:'test'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const matrix = params.map.values.castTo('nmtx').asNumericMatrix;
    if (matrix == null) {
      return new CompilationError(ErrorName.StatTest_NonRect,params.map.values,params.map.values,'Ind.operate non rect');
    }
    if (matrix.rowCount < 2 || matrix.columnCount < 2) {
      return new CompilationError(ErrorName.StatTest_TooLittleData,params.map.values,params.map.values,'IndTest.operate too small');
    }
    const alpha = params.map.alpha?.castTo('num').value ?? 0.05;
    if (alpha < 0 || alpha > 1) {
      return new CompilationError(ErrorName.StatTest_InvalidAlpha,params.map.alpha,params.map.alpha,'IndTest.operate illegal alpha');
    }
    const rowSums: number[] = [];
    for (let r = 0; r < matrix.rowCount; r++) {
      rowSums.push(matrix.getRowSum(r));
    }
    const columnSums: number[] = [];
    for (let c = 0; c < matrix.columnCount; c++) {
      columnSums.push(matrix.getColumnSum(c));
    }
    const grandTotal = columnSums.reduce((a,b)=>a+b,0);

    const expected: number[][] = [];
    for (let r = 0; r < matrix.rowCount; r++) {
      const row: number[] = [];
      for (let c = 0; c < matrix.columnCount; c++) {
        row.push(rowSums[r] * columnSums[c] / grandTotal);
      }
      expected.push(row);
    }

    let chiSq = 0;
    for (let r = 0; r < matrix.rowCount; r++) {
      for (let c = 0; c < matrix.columnCount; c++) {
        chiSq += (matrix.get(r,c) - expected[r][c]) ** 2 / expected[r][c];
      }
    }

    const dof = (matrix.rowCount - 1) * (matrix.columnCount - 1);
    const pValue = 1 - jStat.chisquare.cdf(chiSq,dof);

    return {value:new StatTestResult(-1,this.line,{
      testType: 'chisq',
      testStat: chiSq,
      pValue: pValue,
      rejected: pValue < alpha,
      dof: dof
    },''),warnings:params.warnings};
  }
}
class GoodnessOfFitTest extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'goftest','Tests if a distribution matches an expected distribution',[
      {name:'observed',types:['nvec'],desc:'The observed values'},
      {name:'expected',types:['nvec'],desc:'The expected distribution'},
      {name:'alpha',types:['num'],desc:'The significance level',optional:true,default:'5%'}
    ],[{type:'test'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }

    const observed = params.map.observed.castTo('nvec').asNumberArray;
    const expected = params.map.expected.castTo('nvec').asNumberArray;
    if (observed.length != expected.length) {
      const report = [params.map.observed,params.map.expected];
      return new CompilationError(ErrorName.StatTest_UnequalGOFSize,report,report,'GOFTest.operate mismatch');
    }
    if (observed.length < 2) {
      const report = [params.map.observed,params.map.expected];
      return new CompilationError(ErrorName.StatTest_TooLittleData,report,report,'GOFTest.operate too small');
    }

    const alpha = params.map.alpha?.castTo('num').value ?? 0.05;
    if (alpha < 0 || alpha > 1) {
      return new CompilationError(ErrorName.StatTest_InvalidAlpha,params.map.alpha,params.map.alpha,'GOFTest.operate invalid alpha');
    }

    const dof = observed.length - 1;
    let chisq = 0;
    for (let i = 0; i < observed.length; i++) {
      chisq += (observed[i] - expected[i]) ** 2 / expected[i];
    }

    const pValue = 1 - jStat.chisquare.cdf(chisq,dof);

    return {value:new StatTestResult(-1,this.line,{
      testType: 'chisq',
      dof: dof,
      rejected: pValue < alpha,
      testStat: chisq,
      pValue: pValue
    },''),warnings:params.warnings};
  }
}
class FStatTest extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'ftest','Compares the variance of two samples',[
      {name:'sample1',types:['nvec'],desc:'The first sample to compare'},
      {name:'sample2',types:['nvec'],desc:'The second sample to compare'},
      {name:'alt',types:['operator'],desc:'The alternate hypothesis',optional:true,default:'~='},
      {name:'alpha',types:['num'],desc:'The significance level of the test',optional:true,default:'5%'},
    ],[{type:'test'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const check = StatTestResult.checkParameters(params);
    if (check instanceof CompilationError) {
      return check;
    }
    const sample1 = params.map.sample1.castTo('nvec').asNumberArray;
    const sample2 = params.map.sample2.castTo('nvec').asNumberArray;
    if (sample1.length < 2) {
      return new CompilationError(ErrorName.StatTest_TooLittleData,params.map.sample1,params.map.sample1,'FTest.operate too little sam1');
    }
    if (sample2.length < 2) {
      return new CompilationError(ErrorName.StatTest_TooLittleData,params.map.sample2,params.map.sample2,'FTest.operate too little sam2');
    }
    let df1: number;
    let df2: number;
    let fStat: number;
    const v1 = SuperMath.sampleVariance(sample1);
    const v2 = SuperMath.sampleVariance(sample2);
    // console.log('sx',v1,v2);
    if (v1 > v2) {
      fStat = v1 / v2;
      df1 = sample1.length - 1;
      df2 = sample2.length - 1;
    } else {
      fStat = v2 / v1;
      df1 = sample2.length - 1;
      df2 = sample1.length - 1;
    }
    let pValue = jStat.ftest(fStat,df1,df2);
    const alt = params.map.alt?.value ?? '~=';
    if (alt == '~=') {
      pValue *= 2;
    } else if (alt == '<') {
      pValue = 1 - pValue;
    }
    const alpha = params.map.alpha?.castTo('num').value ?? 0.05;
    return {value:new StatTestResult(-1,this.line,{
      testType: 'F',
      testStat: fStat,
      dof: Infinity,
      pValue: pValue,
      rejected: pValue < alpha
    },''),warnings:params.warnings};
  }
}
class ANOVA extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'anova','Compares the mean of more than samples',[
      {name:'samples',types:['nmtx'],desc:'The samples to compare as a matrix with each sample in a row'},
      {name:'alpha',types:['num'],desc:'The significance level of the test',optional:true,default:'5%'},
    ],[{type:'test'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const check = StatTestResult.checkParameters(params);
    if (check instanceof CompilationError) {
      return check;
    }
    const samples: number[][] = [];
    for (const row of params.map.samples.castTo('nmtx')) {
      samples.push(row.asNumberArray);
    }
    const fScore = jStat.anovafscore(...samples);
    if (isNaN(fScore)) {
      return new CompilationError(ErrorName.StatTest_Unknown,this,this,'anova.operate fscore NaN');
    }
    const pValue = jStat.anovaftest(...samples);
    if (isNaN(pValue)) {
      return new CompilationError(ErrorName.StatTest_Unknown,this,this,'anova.operate pvalue NaN');
    }
    const alpha = params.map.alpha?.castTo('num').value ?? 0.05;
    return {value:new StatTestResult(-1,this.line,{
      testType: 'F',
      testStat: fScore,
      dof: Infinity,
      pValue: pValue,
      rejected: pValue < alpha
    },''),warnings:params.warnings};
  }
}

// ~ APPENDABLES ~

class LineDataGroup<T> {
  public readonly line: CodeLine;
  public readonly value: T;

  public constructor(line: CodeLine,value: T) {
    this.line = line;
    this.value = value;
  }

  get index(): number { return this.line.index; }
}
abstract class AppendableValue extends StorableSymbol<undefined> {
  protected readonly appendedValues = new OrderedQueue<LineDataGroup<AbstractStorable>>();
  protected readonly freezeValues = new OrderedQueue<LineDataGroup<boolean>>();

  public abstract isAppendableType(value: AbstractSymbol): boolean;

  protected copyOverValues<T extends AppendableValue>(clone: T,line?: CodeLine): T {
    if (line == undefined) {
      return this as unknown as T;
    }
    for (const value of this.freezeValues) {
      if (value.index > line.index) {
        break;
      }
      clone.freezeValues.enqueue(value);
    }
    for (const value of this.appendedValues) {
      if (value.index > line.index) {
        break;
      }
      clone.appendedValues.enqueue(value,true);
    }
    return clone;
  }

  public updateOrdering(): void {
    this.freezeValues.update();
    // console.log('BEFORE UPDATE',this.appendedValues.size);
    this.appendedValues.update();
    // console.log('AFTER UPDATE',this.appendedValues.size);
  }
  public removeValuesFromLine(line: CodeLine): void {
    console.log('REMOVING FROM',line.index);
    this.freezeValues.removeWithIndex(line);
    this.appendedValues.removeWithIndex(line);
  }
  protected getValuesBeforeLine(line: CodeLine): AbstractStorable[] {
    const syms: AbstractStorable[] = [];
    for (const set of this.appendedValues) {
      if (set.index > line.index) {
        break;
      }
      syms.push(set.value);
    }
    return syms;
  }

  public setFreezeStatus(line: CodeLine,status: boolean) {
    this.freezeValues.enqueue(new LineDataGroup(line,status),true);
  }
  public getFreezeStatus(line: CodeLine): boolean {
    if (this.freezeValues.size == 0 || line.index < this.freezeValues.peekFirst!.index) {
      return false;
    }
    for (let i = 0; i < this.freezeValues.size - 1; i++) {
      if (line.index <= this.freezeValues.peekAt(i+1)!.index) {
        return this.freezeValues.peekAt(i)!.value;
      }
    }
    return this.freezeValues.peekLast!.value;
  }

  public append(other: AbstractStorable,line: CodeLine): CompilationError | CompilationWarning | CompilationRecommendation | null {
    if (!this.isAppendableType(other)) {
      return new CompilationError(ErrorName.Appendable_WrongType,[other,this],[other,this],'Appendable.append inner check');
    }
    if (this.getFreezeStatus(line)) {
      return new CompilationError(ErrorName.Appendable_Frozen,[other,this],[other,this],'Appendable.append frozen check');
    }
    this.appendedValues.enqueue(new LineDataGroup(line,other),true);
    return null;
  }
}

// ~ PLOT ~

type PlotDatum = {
  readonly type: 'scatter';
  readonly x: ReadonlyArray<number>;
  readonly y: ReadonlyArray<number>;
  readonly title?: string;
  readonly xLabel?: string;
  readonly yLabel?: string;
  readonly sizes?: ReadonlyArray<number>;
  readonly includeOrigin?: boolean;
  readonly includeOriginX?: boolean;
  readonly includeOriginY?: boolean;
};
interface IAxisRange {
  start: number;
  end: number;
}
interface IAxisTicks extends IAxisRange {
  tick: number;
}
class Plot extends AppendableValue {
  private static readonly TARGET_TICK_SIZE = 8;

  private readonly data: PlotDatum[];

  public constructor(index: number,line: CodeLine,text: string,data: PlotDatum[],name?: string) {
    super(index,line,undefined,text,'plot',name);
    this.data = data;
  }

  private static addTicks(bounds: IAxisRange): IAxisTicks {
    if (bounds.start == bounds.end) {
      if (Number.isInteger(bounds.start)) {
        return {start:bounds.start-0.5,end:bounds.end+0.5,tick:0.5};
      } else {
        return {start:Math.floor(bounds.start),end:Math.ceil(bounds.end),tick:0.5};
      }
    }
    const range = bounds.end - bounds.start;
    let tickSize = 0.001;
    let toggle = false;
    let bestTickSize = 0;
    let smallestError = Infinity;
    while (tickSize < range) {
      const quotient = range / tickSize;
      const error = Math.abs(quotient - Plot.TARGET_TICK_SIZE);
      if (error < smallestError) {
        smallestError = error;
        bestTickSize = tickSize;
      }
      toggle = !toggle;
      tickSize *= (toggle?5:2);
    }
    return {
      start: Math.floor(bounds.start / bestTickSize) * bestTickSize,
      end: Math.ceil(bounds.end / bestTickSize) * bestTickSize,
      tick: bestTickSize
    }
  }

  public isAppendableType(value: AbstractSymbol): boolean {
    return value.castableTo('plot');
  }
  public clone(index: number,text?: string,line?: CodeLine): Plot {
    const clone = new Plot(index,line ?? this.line,text ?? this.text,this.data,this.name);
    this.copyOverValues(clone,line);
    return clone;
  }
  public rename(index: number,name: string,line: CodeLine): Plot {
    const clone = new Plot(index,line,name,this.data,name);
    this.copyOverValues(clone,line);
    return clone;
  }
  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (withReference) {
      return this.name == other.name;
    }
    return false;
  }
  get preview(): string { return ''; }

  private buildScatter(xAxis: IAxisTicks,yAxis: IAxisTicks,x: ReadonlyArray<number>,y: ReadonlyArray<number>,xLabel?: string,yLabel?: string,title?: string): string {
    // const xRange: IAxisRange = {
    //   start: Math.min.apply(null,x as number[]),
    //   end: Math.max.apply(null,x as number[]),
    // };
    // const yRange: IAxisRange = {
    //   start: Math.min.apply(null,y as number[]),
    //   end: Math.max.apply(null,y as number[]),
    // };
    // const xAxis = Plot.addTicks(xRange);
    // const yAxis = Plot.addTicks(yRange);
    // let svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">';
    let svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">';
    // svg += '<rect x="0" y="0" height="100" width="100" fill="none" stroke="black" stroke-width="0.5"></rect>';
    // svg += '<rect x="5" y="5" height="90" width="90" fill="none" stroke="green" stroke-width="0.2"></rect>';
    const xPos = yAxis.start > 0 ? 90 : yAxis.end < 0 ? 10 : 100 - (10 + -yAxis.start / (yAxis.end - yAxis.start) * 80);
    const yPos = xAxis.start > 0 ? 10 : xAxis.end < 0 ? 90 : (10 + -xAxis.start / (xAxis.end - xAxis.start) * 80);

    // ~ MINOR GRIDLINES ~
    svg += `<g stroke-linecap="round" stroke-width="0.1" stroke="lightgrey">`;
    const xMinorGridlines = xAxis.tick / 2;
    const xMinorGridCount = Math.round( (xAxis.end - xAxis.start) / xMinorGridlines );
    for (let i = 0; i <= xMinorGridCount; i++) { //x minor
      const X = 10 + i * 80 / xMinorGridCount;
      if (X == yPos) {
        continue;
      }
      svg += `<line x1="${X.toFixed(2)}" x2="${X.toFixed(2)}" y1="10" y2="90"></line>`;
    }
    const yMinorGridlines = yAxis.tick / 2;
    const yMinorGridCount = Math.round( (yAxis.end - yAxis.start) / yMinorGridlines );
    for (let i = 0; i <= yMinorGridCount; i++) { //y minor
      const Y = 10 + i * 80 / yMinorGridCount;
      if (Y == xPos) {
        continue;
      }
      svg += `<line y1="${Y.toFixed(2)}" y2="${Y.toFixed(2)}" x1="10" x2="90"></line>`;
    }
    svg += '</g>';

    // ~ MAJOR GRIDLINES ~
    svg += `<g stroke-linecap="round" stroke-width="0.2" stroke="grey">`;
    const xMajorGridlines = xAxis.tick;
    const xMajorGridCount = Math.round( (xAxis.end - xAxis.start) / xMajorGridlines );
    for (let i = 0; i <= xMajorGridCount; i++) { //x major
      const X = 10 + i * 80 / xMajorGridCount;
      if (X == yPos) {
        continue;
      }
      svg += `<line x1="${X.toFixed(2)}" x2="${X.toFixed(2)}" y1="10" y2="90"></line>`;
    }
    const yMajorGridlines = yAxis.tick;
    const yMajorGridCount = Math.round( (yAxis.end - yAxis.start) / yMajorGridlines );
    for (let i = 0; i <= yMajorGridCount; i++) { //y major
      const Y = 10 + i * 80 / yMajorGridCount;
      if (Y == xPos) {
        continue;
      }
      svg += `<line y1="${Y.toFixed(2)}" y2="${Y.toFixed(2)}" x1="10" x2="90"></line>`;
    }
    svg += '</g>';

    // ~ AXIS LINES ~
    svg += '<g stroke-linecap="round" stroke-width="0.3" stroke="black">';
    if (yAxis.start > 0) {
      svg += `
      <line x1="${yPos.toFixed(2)}" x2="${yPos.toFixed(2)}" y1="90" y2="88"></line>
      <line x1="${yPos.toFixed(2)}" x2="${(yPos-1).toFixed(2)}" y1="88" y2="87.5"></line>
      <line x1="${(yPos-1).toFixed(2)}" x2="${(yPos+1).toFixed(2)}" y1="87.5" y2="86.5"></line>
      <line x1="${(yPos+1).toFixed(2)}" x2="${yPos.toFixed(2)}" y1="86.5" y2="86"></line>
      <line x1="${yPos.toFixed(2)}" x2="${yPos.toFixed(2)}" y1="10" y2="86"></line>
      `;
    } else if (yAxis.end < 0) {
      svg += `
      <line x1="${yPos.toFixed(2)}" x2="${yPos.toFixed(2)}" y1="10" y2="12"></line>
      <line x1="${yPos.toFixed(2)}" x2="${(yPos+1).toFixed(2)}" y1="12" y2="12.5"></line>
      <line x1="${(yPos+1).toFixed(2)}" x2="${(yPos-1).toFixed(2)}" y1="12.5" y2="13.5"></line>
      <line x1="${(yPos-1).toFixed(2)}" x2="${yPos.toFixed(2)}" y1="13.5" y2="14"></line>
      <line x1="${yPos.toFixed(2)}" x2="${yPos.toFixed(2)}" y1="90" y2="14"></line>
      `;
    } else {
      svg += `<line y1="10" y2="90" x1="${yPos.toFixed(2)}" x2="${yPos.toFixed(2)}"></line>`;
    }
    if (xAxis.start > 0) {
      svg += `
      <line x1="10" x2="12" y1="${xPos.toFixed(2)}" y2="${xPos.toFixed(2)}"></line>
      <line x1="12" x2="12.5" y1="${xPos.toFixed(2)}" y2="${(xPos-1).toFixed(2)}"></line>
      <line x1="12.5" x2="13.5" y1="${(xPos-1).toFixed(2)}" y2="${(xPos+1).toFixed(2)}"></line>
      <line x1="13.5" x2="14" y1="${(xPos+1).toFixed(2)}" y2="${xPos.toFixed(2)}"></line>
      <line x1="14" x2="90" y1="${xPos.toFixed(2)}" y2="${xPos.toFixed(2)}"></line>
      `;
    } else if (xAxis.end < 0) {
      svg += `
      <line x1="90" x2="88" y1="${xPos.toFixed(2)}" y2="${xPos.toFixed(2)}"></line>
      <line x1="88" x2="87.5" y1="${xPos.toFixed(2)}" y2="${(xPos-1).toFixed(2)}"></line>
      <line x1="87.5" x2="86.5" y1="${(xPos-1).toFixed(2)}" y2="${(xPos+1).toFixed(2)}"></line>
      <line x1="86.5" x2="86" y1="${(xPos+1).toFixed(2)}" y2="${xPos.toFixed(2)}"></line>
      <line x1="86" x2="10" y1="${xPos.toFixed(2)}" y2="${xPos.toFixed(2)}"></line>
      `;
    } else {
      svg += `<line x1="10" x2="90" y1="${xPos.toFixed(2)}" y2="${xPos.toFixed(2)}"></line>`;
    }
    svg += '</g>';

    // ~ AXIS TICKS ~
    const xTickCount = Math.round( (xAxis.end - xAxis.start) / xAxis.tick);
    const yTickCount = Math.round( (yAxis.end - yAxis.start) / yAxis.tick);
    svg += '<g font-size="10%" stroke-width="0.3"><g dominant-baseline="middle">';
    for (let i = 0; i <= xTickCount; i++) { //x axis labels
      const V = xAxis.start + xAxis.tick * i;
      if (V == 0) {
        continue;
      }
      const X = 10 + i * 80 / xTickCount;
      const Y = xPos >= 50 ? xPos + 1.5 : xPos - 1.5  ;
      svg += `<text text-anchor="${V<0?'start':'end'}" x="${X.toFixed(2)}" y="${Y.toFixed()}">${SuperMath.decimalFix(V)}</text>`;
      svg += `<line stroke="black" x1="${X.toFixed(2)}" x2="${X.toFixed(2)}" y1="${(xPos-0.5).toFixed(2)}" y2="${(xPos+0.5).toFixed(2)}"></line>`;
    }
    svg += `</g><g text-anchor="${yPos>50?'start':'end'}">`;
    for (let i = 0; i <= yTickCount; i++) { //y axis labels
      const V = yAxis.start + yAxis.tick * i;
      if (V == 0) {
        continue;
      }
      const Y = 100 - (10 + i * 80 / yTickCount);
      const X = yPos > 50 ? yPos + 1 : yPos - 1;
      svg += `<text x="${X.toFixed(2)}" y="${Y.toFixed()}" dominant-baseline="${V<0?'hanging':'auto'}">${SuperMath.decimalFix(V)}</text>`;
      svg += `<line stroke="black" x1="${(yPos-0.5).toFixed(2)}" x2="${(yPos+0.5).toFixed(2)}" y1="${Y.toFixed(2)}" y2="${Y.toFixed(2)}"></line>`;
    }
    svg += '</g></g>';



    svg += '<g text-anchor="middle" dominant-baseline="middle" font-size="15%">';
    if (xPos >= 50) {
      if (xLabel != undefined) {
        svg += `<text x="50" y="98">${xLabel}</text>`;
      }
      if (title != undefined) {
        svg += `<text x="50" y="3" font-size="180%" font-weight="bold">${title}</text>`;
      }
    } else {
      if (xLabel != undefined) {
        svg += `<text x="50" y="3">${xLabel}</text>`;
      }
      if (title != undefined) {
        svg += `<text x="50" y="98" font-size="180%" font-weight="bold">${title}</text>`;
      }
    }
    if (yLabel != undefined) {
      if (yPos >= 50) {
        svg += `<text transform="rotate(90 97.5 50)" x="97.5" y="50">${yLabel}</text>`;
      } else {
        svg += `<text transform="rotate(-90 3 50)" x="3" y="50">${yLabel}</text>`;
      }
    }
    svg += '</g>';



    for (let i = 0; i < Math.min(x.length,y.length); i++) {
      const cx = (10 + (x[i] - xAxis.start) / (xAxis.end - xAxis.start) * 80);
      const cy = (10 + (1 - (y[i] - yAxis.start) / (yAxis.end - yAxis.start)) * 80);
      svg += `<circle fill="blue" r="0.8" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}"></circle>`;
      // svg += `<text fill="green" font-size="15%" x="${cx+1}" y="${cy-1}">(${x[i]},${y[i]})</text>`;
    }
    svg += '</svg>';
    // fs.writeFileSync('scatter_plotted.svg',svg);
    return svg;
  }

  public render(line: CodeLine): Document {
    if (this.data.length == 0) {
      return new DOMParser().parseFromString('<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">','image/svg+xml');
    }
    const xRange: IAxisRange = {start:0,end:0};
    const yRange: IAxisRange = {start:0,end:0};
    let includeOrigin = false;
    let includeOriginX = false;
    let includeOriginY = false;
    for (const datum of this.data) { //find inner plots
      let minX: number | undefined;
      let maxX: number | undefined;
      let minY: number | undefined;
      let maxY: number | undefined;
      if (datum.type == 'scatter') {
        minX = Math.min.apply(null,datum.x as number[]);
        maxX = Math.max.apply(null,datum.x as number[]);
        minY = Math.min.apply(null,datum.y as number[]);
        maxY = Math.max.apply(null,datum.y as number[]);
      }
      if (minX != undefined) { xRange.start = Math.min(xRange.start,minX); }
      if (maxX != undefined) { xRange.end = Math.max(xRange.end,maxX); }
      if (minY != undefined) { yRange.start = Math.min(yRange.start,minY); }
      if (maxY != undefined) { yRange.end = Math.max(yRange.end,maxY); }
      if ('includeOrigin' in datum) { includeOrigin ||= (datum.includeOrigin ?? false); }
      if ('includeOriginX' in datum) { includeOriginX ||= (datum.includeOriginX ?? false); }
      if ('includeOriginY' in datum) { includeOriginY ||= (datum.includeOriginY ?? false); }
    }
    if (includeOrigin || includeOriginX) {
      if (xRange.start > 0) { xRange.start = 0; }
      if (xRange.end < 0) { xRange.end = 0; }
    }
    if (includeOrigin || includeOriginY) {
      if (yRange.start > 0) { yRange.start = 0; }
      if (yRange.end < 0) { yRange.end = 0; }
    }
    const xAxis = Plot.addTicks(xRange);
    const yAxis = Plot.addTicks(yRange);
    let svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">';
    for (const datum of this.data) {
      if (datum.type == 'scatter') {
        svg += this.buildScatter(xAxis,yAxis,datum.x,datum.y,datum.title,datum.xLabel,datum.yLabel);
      }
    }
    svg += '</svg>';
    return new DOMParser().parseFromString(svg,'image/svg+xml');
  }
}
class PlotInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'plot','Makes an empty plot object',[],[{type:'plot'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    return {value:new Plot(-1,this.line,'',[]),warnings:params.warnings};
  }

  get propertyNames(): string[] {
    return ['scatter'];
  }
  public getNamedProperty(index: AbstractSymbol): CompilationError | AbstractStorable {
    const name = KeyableSymbol.getPropName(index);
    if (name == 'scatter') {
      return new ScatterPlotInator(-1,this.line);
    }
    return new CompilationError(ErrorName.SIndex_Invalid,index,index,'PlotInator.getNamedProp');
  }
}
class ScatterPlotInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'scatter','Builds a scatter plot',[
      {name:'x',types:['nvec'],desc:'The x values to plot'},
      {name:'y',types:['nvec'],desc:'The y values to plot'},
      {name:'title',types:['str'],desc:'The title of the plot',optional:true,default:'none'},
      {name:'xlab',types:['str'],desc:'The label for the x-axis',optional:true,default:'none'},
      {name:'ylab',types:['str'],desc:'The label for the y-axis',optional:true,default:'none'},
      {name:'inc_ori',types:['bool'],desc:'Whether to force the plot to include the origin',optional:true,default:'false'},
      {name:'inc_ori_x',types:['bool'],desc:'Whether to force the plot to include the origin on the x-axis',optional:true,default:'false'},
      {name:'inc_ori_y',types:['bool'],desc:'Whether to force the plot to include the origin on the y-axis',optional:true,default:'false'},
    ],[{type:'plot'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const x: ReadonlyArray<number> = params.map.x.castTo('nvec').asNumberArray;
    const y: ReadonlyArray<number> = params.map.y.castTo('nvec').asNumberArray;
    if (x.length != y.length) {
      const display = [params.map.x,params.map.y];
      return new CompilationError(ErrorName.Scatter_MismatchedSizes,display,display,'ScatterInator.operate');
    }
    const title = params.map.title?.castTo('str').rawValue;
    const xLabel = params.map.xlab?.castTo('str').rawValue;
    const yLabel = params.map.ylab?.castTo('str').rawValue;
    const includeOrigin = params.map.inc_ori?.castTo('bool').value;
    const includeOriginX = params.map.inc_ori_x?.castTo('bool').value;
    const includeOriginY = params.map.inc_ori_y?.castTo('bool').value;
    return {value:new Plot(-1,this.line,'',[
      {
        type: 'scatter',
        x,
        y,
        includeOrigin,
        includeOriginX,
        includeOriginY,
        title,
        xLabel,
        yLabel
      }
    ]),warnings:params.warnings};
  }
}

// ~ GRAPH ~

class Network extends AppendableValue {
  private readonly bidirectional: boolean;

  public constructor(index: number,line: CodeLine,text: string,bidirectional: boolean,name?: string) {
    super(index,line,undefined,text,'ntwk',name);
    this.bidirectional = bidirectional;
  }

  public static FromGraph(graph: DiGraph<number|string>,line: CodeLine): Network {
    const ntwk = new Network(-1,line,'',graph instanceof BiGraph);
    const nodeMap = new Map<string|number,NetworkNode>();
    for (const vertex of graph.getVertices()) {
      const vertexNode = new NetworkNode(-1,line,'',vertex,graph.checkAsSource(vertex),graph.checkAsSink(vertex));
      nodeMap.set(vertex,vertexNode);
      ntwk.append(vertexNode,line);
    }
    for (const edge of graph.getEdges()) {
      ntwk.append(new NetworkEdge(-1,line,'',nodeMap.get(edge[0])!,nodeMap.get(edge[1])!,edge[2]),line);
    }
    return ntwk;
  }

  public isAppendableType(value: AbstractSymbol): boolean {
    return value instanceof NetworkNode || value instanceof NetworkEdge;  
  }
  private getSizeCount(beforeLine?: CodeLine): {nodes:number;edges:number;} {
    let nodes = 0;
    let edges = 0;
    for (const value of this.appendedValues) {
      if (beforeLine && value.line.index > beforeLine.index) {
        break;
      }
      if (value.value.type == 'node') {
        nodes++;
      } else {
        edges++;
      }
    }
    return {nodes,edges};
  }

  public clone(index: number,text?: string,line?: CodeLine): Network {
    const clone = new Network(index,line ?? this.line,text ?? this.text,this.bidirectional,this.name);
    this.copyOverValues(clone,line);
    return clone;
  }
  public rename(index: number,name: string,line: CodeLine): Network {
    const clone = new Network(index,line,name,this.bidirectional,name);
    this.copyOverValues(clone,line);
    return clone;
  }
  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (withReference) {
      return this.name == other.name;
    }
    return false;
  }

  get preview(): string {
    const size = this.getSizeCount();
    return `network[${size.nodes} node${size.nodes==1?'':'s'};${size.edges} edge${size.edges==1?'':'s'}]`;
  }
  get asGraph(): DiGraph<string|number> {
    const graph = this.bidirectional?new BiGraph<string|number>():new DiGraph<string|number>();
    for (const value of this.appendedValues) {
      if (value.value.type == 'edge') {
        const edge = value.value.castTo('edge');
        graph.addEdge(edge.start.nodeId,edge.end.nodeId,edge.weight);
      } else {
        const node = value.value.castTo('node');
        graph.addVertex(node.nodeId);
        if (node.isSource) {
          graph.setAsSource(node.nodeId);
        }
        if (node.isSink) {
          graph.setAsSink(node.nodeId);
        }
      }
    }
    return graph;
  }
}
class NetworkNode extends StorableSymbol<undefined> {
  public readonly nodeId: string | number;
  public readonly isSource: boolean;
  public readonly isSink: boolean;

  public constructor(index: number,line: CodeLine,text: string,id: string | number,isSource?: boolean,isSink?: boolean,name?: string) {
    super(index,line,undefined,text,'node',name);
    this.nodeId = id;
    this.isSource = isSource ?? false;
    this.isSink = isSink ?? false;
  }

  public clone(index: number,text?: string,line?: CodeLine): NetworkNode {
    return new NetworkNode(index,line ?? this.line,text ?? this.text,this.nodeId,this.isSource,this.isSink,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): NetworkNode {
    return new NetworkNode(index,line,name,this.nodeId,this.isSource,this.isSink,name);
  }
  public equals(other: AbstractSymbol,withReference?: boolean | undefined): boolean {
    if (!(other instanceof NetworkNode)) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    return this.nodeId == other.nodeId;
  }
  get preview(): string { return `node[@${this.nodeId}]`; }
}
class NetworkEdge extends StorableSymbol<undefined> {
  public readonly start: NetworkNode;
  public readonly end: NetworkNode;
  public readonly weight?: number;

  public constructor(index: number,line: CodeLine,text: string,start: NetworkNode,end: NetworkNode,weight?: number,name?: string) {
    super(index,line,undefined,text,'edge',name);
    this.start = start;
    this.end = end;
    this.weight = weight;
  }

  public equals(other: AbstractSymbol, withReference?: boolean | undefined): boolean {
    if (!(other instanceof NetworkEdge)) {
      return false;
    }
    if (withReference) {
      return this.name == other.name;
    }
    return this.start.equals(other.start) && this.end.equals(other.end);
  }
  public clone(index: number,text?: string,line?: CodeLine): NetworkEdge {
    return new NetworkEdge(index,line ?? this.line,text ?? this.text,this.start,this.end,this.weight,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): NetworkEdge {
    return new NetworkEdge(index,line,name,this.start,this.end,this.weight,name);
  }
  get preview(): string { return `edge[@${this.start.nodeId}-@${this.end.nodeId}]`; }
}
class NetworkInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'ntwk','Builds an empty network',[
      {name:'bi',types:['bool'],desc:'Whether to make a bidirectional network',optional:true,default:'false'}
    ],[{type:'ntwk'}])
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const bi = params.map.bi?.castTo('bool').value ?? false;
    return {value:new Network(-1,this.line,'',bi),warnings:params.warnings};
  }

  get propertyNames(): string[] { return ['erdos_renyi']; }
  public getNamedProperty(index: AbstractSymbol): CompilationError | AbstractStorable {
    const name = KeyableSymbol.getPropName(index);
    if (name == 'erdos_renyi') {
      return new ErdosRenyiNetworkInator(-1,index.line);
    }
    return super.getNamedProperty(index);
  }
}
class ErdosRenyiNetworkInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'erdos_renyi','Builds a network using the Erdos-Renyi (n,p) model',[
      {name:'n',types:['num'],desc:'The number of nodes to have in the final graph'},
      {name:'p',types:['num'],desc:'The probability of any given edge being present in the graph - [0,1]'},
      {name:'bi',types:['bool'],desc:'Whether to make the network bidirectional',optional:true,default:'false'}
    ],[{type:'ntwk'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const warnings: CompilationWarning[] = params.warnings ?? [];
    let nodeCount = params.map.n.castTo('num').value;
    if (nodeCount < 1 || !Number.isInteger(nodeCount)) {
      return new CompilationError(ErrorName.Erdos_InvalidNodeCount,params.map.n,params.map.n,'Erdos.operate node count');
    }
    if (nodeCount > 100) {
      nodeCount = 100;
      warnings.push(new CompilationWarning(WarningName.Erdos_NodeLimit,params.map.n,params.map.n,'Erdos.operate node limit'));
    }
    const probability = params.map.p.castTo('num').value;
    if (probability < 0 || probability > 1) {
      return new CompilationError(ErrorName.Erdos_InvalidProbability,params.map.p,params.map.p,'Erdos.operate prob check');
    }
    const bidirectional = params.map.bi?.castTo('bool').value ?? false;
    const graph = bidirectional?new BiGraph<number>():new DiGraph<number>();
    for (let i = 1; i <= nodeCount; i++) {
      graph.addVertex(i);
    }
    for (let i = 1; i <= nodeCount; i++) {
      for (let j = bidirectional?i+1:1; j <= nodeCount; j++) {
        if (i == j) {
          continue;
        }
        if (Math.random() < probability) {
          graph.addEdge(i,j);
        }
      }
    }
    return {value:Network.FromGraph(graph,this.line),warnings};
  }
}
class NetworkNodeInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'node','Builds a network node',[
      {name:'id',types:['str','num'],desc:'The node id'},
      {name:'source',types:['bool'],desc:'Whether to make the code a source node',optional:true,default:'false'},
      {name:'sink',types:['bool'],desc:'Whether to make the code a sink node',optional:true,default:'false'},
    ],[{type:'node'}])
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    let name: string | number;
    if (params.map.id.castableTo('str')) {
      name = params.map.id.castTo('str').rawValue;
    } else {
      name = params.map.id.castTo('num').value;
      if (!Number.isInteger(name)) {
        return new CompilationError(ErrorName.Node_NonIntegerName,[params.map.id],[params.map.id],'')
      }
    }
    return {
      value: new NetworkNode(-1,this.line,'',name,params.map.isSource?.castTo('bool').value,params.map.isSink?.castTo('bool').value),
      warnings: params.warnings
    };
  }
}
class NetworkSourceInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'source','Builds a source node',[
      {name:'id',types:['str','num'],desc:'The node id'},
    ],[{type:'node'}])
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    let name: string | number;
    if (params.map.id.castableTo('str')) {
      name = params.map.id.castTo('str').rawValue;
    } else {
      name = params.map.id.castTo('num').value;
      if (!Number.isInteger(name)) {
        return new CompilationError(ErrorName.Node_NonIntegerName,[params.map.id],[params.map.id],'')
      }
    }
    return {
      value: new NetworkNode(-1,this.line,'',name,true),
      warnings: params.warnings
    };
  }
}
class NetworkSinkInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'sink','Builds a sink node',[
      {name:'id',types:['str','num'],desc:'The node id'},
    ],[{type:'node'}])
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    let name: string | number;
    if (params.map.id.castableTo('str')) {
      name = params.map.id.castTo('str').rawValue;
    } else {
      name = params.map.id.castTo('num').value;
      if (!Number.isInteger(name)) {
        return new CompilationError(ErrorName.Node_NonIntegerName,[params.map.id],[params.map.id],'')
      }
    }
    return {
      value: new NetworkNode(-1,this.line,'',name,undefined,true),
      warnings: params.warnings
    };
  }
}
class NetworkEdgeInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'edge','Builds a sink node',[
      {name:'start',types:['node','str','num'],desc:'The start node or node id'},
      {name:'end',types:['node','str','num'],desc:'The end node or node id'},
      {name:'weight',types:['num'],desc:'The edge weight',default:'1',optional:true},
    ],[{type:'node'}])
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    let startNode: NetworkNode;
    let endNode: NetworkNode;
    if (params.map.start.castableTo('node')) {
      startNode = params.map.start.castTo('node');
    } {
      startNode = new NetworkNode(
        -1,this.line,'',
        (params.map.start.castableTo('str')?params.map.start.castTo('str'):params.map.start.castTo('num')).value
      );
    }
    if (params.map.end.castableTo('node')) {
      endNode = params.map.end.castTo('node');
    } {
      endNode = new NetworkNode(
        -1,this.line,'',
        (params.map.end.castableTo('str')?params.map.end.castTo('str'):params.map.end.castTo('num')).value
      );
    }
    return {
      value: new NetworkEdge(-1,this.line,'',startNode,endNode,params.map.weight?.castTo('num').value),
      warnings: params.warnings
    };
  }
}

// ~ MACRO ~

type MacroParam = FunctionParam;
abstract class Macro extends ResolvingSymbol<undefined> {
  private readonly desc: string;
  private readonly params: ReadonlyArray<MacroParam>;

  protected constructor(index: number,line: CodeLine,value: string,desc: string,params: FlexArray<MacroParam>) {
    super(index,line,undefined,value,'macro');
    this.desc = desc;
    this.params = params;
  }

  public static Build(index: number,line: CodeLine,value: string): Macro | ProxySymbol {
    switch(value) {
      case 'min_path':
        return new MinPath(index,line);
      case 'maximize': case 'minimize':
        return new LinearOptimizer(index,line,value);
      case 'lindoize':
        return new Lindoize(index,line);
      case 'render':
        return new Render(index,line);
      case 'print':
        return new Print(index,line);
    }
    return new ProxySymbol(index,line,value);
  }

  public clone(index: number,text?: string,line?: CodeLine): Macro {
    return Macro.Build(index,line ?? this.line,this.text!) as Macro;
  }
  public equals(other: AbstractSymbol): boolean {
    if (!(other instanceof Macro)) {
      return false;
    }
    return this.text == other.text;
  }

  protected mapParameters(values: IFunctionInput[]): IFunctionNamedParam | CompilationError {
    return BuiltInFunction.parseParameters(values,this.params,this.text);
  }

  public abstract operate(values: IFunctionInput[],output: OutputLine): void;
  public validate(values: IFunctionInput[]): CompilationError | undefined {
    // if (values.length > this.params.length) {
    //   return false;
    // }
    // for (let i = 0; i < this.params.length; i++) {
    //   if (!(this.params[i].types.includes(values[i].type) || (values[i] == undefined && this.params[i].optional))) {
    //     return false;
    //   }
    // }
    // return true;
    const params = this.mapParameters(values);
    return params instanceof CompilationError ? params : undefined;
  }

  get preview(): string {
    let base = this.text + ' &#45; ' + this.desc + '&#10;&#10;';
    for (let i = 0; i < this.params.length; i++) {
      const P = this.params[i];
      base += `@param ${P.name}${P.optional?'?':''}${P.default?` {default=${P.default}}`:''} <${P.types.join('|')}> &#45; ${P.desc}&#10;`;
    }
    return base;
  }
  get signature(): string {
    return `(${this.params.map(e => `${e.name}${e.optional?'?':''}:${e.types.join('|')}`).join(',')})`;
  }
}
class MinPath extends Macro {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'min_path','Finds the minumum cost path from one node to all nodes in a network',[
      {name:'net',types:['ntwk'],desc:'The network to find the min path from'},
      {name:'anchor',types:['node','str','num'],desc:'The node from which to find the minimum cost paths'},
      {name:'render',types:['bool'],desc:'Whether to print the resulting graph to the console alongside the minimum paths',optional:true,default:'false'},
    ]);
  }

  public operate(values: AbstractSymbol[],output: OutputLine): void {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      output.outputText(params.toString(),'error');
      return;
    }
    const graph = params.map.net.castTo('ntwk').asGraph;
    let anchor: string | number;
    if (params.map.anchor.castableTo('node')) {
      anchor = params.map.anchor.castTo('node').nodeId;
    } else if (params.map.anchor.castableTo('str')) {
      anchor = params.map.anchor.castTo('str').rawValue;
    } else {
      anchor = params.map.anchor.castTo('num').value;
    }
    if (typeof anchor == 'number' && !Number.isInteger(anchor)) {
      output.outputText(`Node ${anchor} is not an integer`,'error');
      return;
    }
    if (!graph.hasVertex(anchor)) {
      output.outputText(`Graph does not have a node with id ${anchor}`,'error');
      return;
    }
    const traversal = graph.traverse(anchor);
    if (traversal == null) {
      output.outputText('Traversal could not be completed','error');
      return;
    }
    const tableValues: OutputTableValue = [
      [{title:'Node'},{title:'Cost'},{title:'Path'}]
    ];
    for (const [node,path] of traversal.entries()) {
      tableValues.push([{value:node},{value:path.weight},{value:path.path.join('->')}]);
    }
    for (const vertex of graph.getVertices()) {
      if (!traversal.has(vertex)) {
        tableValues.push([{value:vertex},{value:'None'},{value:'None'}]);
      }
    }
    output.outputTable(tableValues);
    const render = params.map.render?.castTo('bool').value ?? false;
    if (render) {
      output.outputDocument(graph.exportAsSVGDocument());
    }
  }
}
class Render extends Macro {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'render','Renders an object in the console',[
      {name:'obj',types:['plot'],desc:'The object to render'}
    ]);
  }

  public operate(values: IFunctionInput[],output: OutputLine): void {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      output.outputText(params.toString(),'error');
      return;
    }
    if (params.map.obj.castableTo('plot')) {
      const plot = params.map.obj.castTo('plot');
      output.outputDocument(plot.render(this.line));
    } else {
      output.outputText('Unknown render system','error');
    }
  }
}
class Print extends Macro {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'print','Prints an object in the console',[
      {name:'obj',types:['any'],desc:'The object to print'}
    ]);
  }

  public operate(values: IFunctionInput[],output: OutputLine): void {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      output.outputText(params.toString(),'error');
      return;
    }
    const object = params.map.obj;
    if (object instanceof StorableSymbol) {
      output.outputText(object.preview); 
    } else {
      output.outputText('Cannot print this value','error'); 
    }
  }
}

// ~ LP ~

type BoundDict = {
  readonly lhs: Alias;
  readonly cmp: Inequality;
  readonly rhs: Alias;
} | {
  readonly lhs: BoundValue;
  readonly cmp: BoundOperator | '=>' | '<=>';
  readonly rhs: BoundValue;
} | {
  readonly lhs: Alias;
  readonly cmp: 'is';
  readonly rhs: NoneType;
  readonly is: 'bin' | 'urs' | 'int';
};
class BoundValue extends StorableSymbol<BoundDict> {
  public constructor(index: number,line: CodeLine,value: BoundDict,text: string,name?: string) {
    super(index,line,value,text,'bound',name);
  }
  
  public clone(index: number,text?: string,line?: CodeLine): BoundValue {
    return new BoundValue(index,line ?? this.line,this.value,text ?? this.text,this.name);
  }
  public rename(index: number,name: string,line: CodeLine): BoundValue {
    return new BoundValue(index,line,this.value,name,name);
  }
  public equals(other: AbstractSymbol,withReference?: boolean): boolean {
    if (!(other instanceof BoundValue)) { return false; }
    if (withReference) { return this.name == other.name; }
    return this.value.cmp == other.value.cmp && this.value.lhs.equals(other.value.lhs) &&
      this.value.rhs.equals(other.value.rhs);
  }
  get preview(): string {
    if ('is' in this.value) {
      return this.value.lhs.preview + ' is ' + this.value.is;
    }
    return this.value.lhs.preview + ' ' + this.value.cmp + ' ' + this.value.rhs.preview;
  }

  get isSimple(): boolean { return SimplexSolver.isInequality(this.value.cmp); }
  get isLogical(): boolean { return SimplexSolver.isOperator(this.value.cmp); }
  get isIf(): boolean { return this.value.cmp == '=>' || this.value.cmp == '<=>'; }

  get boundize(): Bound | {readonly type:'bin'|'int'|'urs',readonly dict:Record<string,number>,readonly offset:number} {
    if (this.isSimple) {
      const lhs: Record<string,number> = {};
      let rhs = 0;
      for (const pair of this.value.lhs.castTo('alias').value) {
        if (pair.val) {
          lhs[pair.val.name!] = (lhs[pair.val.name!] ?? 0) + pair.coeff.value;
        } else {
          rhs -= pair.coeff.value;
        }
      }
      for (const pair of this.value.rhs.castTo('alias').value) {
        if (pair.val) {
          lhs[pair.val.name!] = (lhs[pair.val.name!] ?? 0) - pair.coeff.value;
        } else {
          rhs += pair.coeff.value;
        }
      }
      return {
        lhs: lhs,
        cmp: this.value.cmp as '<',
        rhs: rhs
      };
    } else if (this.isLogical) {
      return {
        a: this.value.lhs.castTo('bound').boundize as IStandardBound,
        b: this.value.rhs.castTo('bound').boundize as IStandardBound,
        operator: this.value.cmp as '|'
      };
    } else if (this.value.cmp == '=>') {
      return {
        antecedent: this.value.lhs.castTo('bound').boundize as IStandardBound,
        consequent: this.value.rhs.castTo('bound').boundize as IStandardBound,
      };
    } else if (this.value.cmp == '<=>') { // <=>
      return {
        p: this.value.lhs.castTo('bound').boundize as IStandardBound,
        q: this.value.rhs.castTo('bound').boundize as IStandardBound,
      };
    } else if ('is' in this.value) {
      return {type:this.value.is,...this.value.lhs.castTo('alias').getParsed()}
    }
    console.error(this.value);
    throw new Error('Could not boundize value');
  }
}
class LPModel extends AppendableValue {
  private readonly objective: Alias;

  public constructor(index: number,line: CodeLine,text: string,objective: Alias,name?: string) {
    super(index,line,undefined,text,'model',name);
    this.objective = objective;
    // this.threshold = threshold;
  }

  public isAppendableType(value: AbstractSymbol): boolean {
    return value.castableTo('bound');
  }
   
  public clone(index: number,text?: string,line?: CodeLine): LPModel {
    const model = new LPModel(index,line ?? this.line,text ?? this.text,this.objective,this.name);
    this.copyOverValues(model,line);
    return model;
  }
  public rename(index: number,name: string,line: CodeLine): LPModel {
    const model = new LPModel(index,line,name,this.objective,name);
    this.copyOverValues(model,line);
    return model;
  }
  public equals(other: AbstractSymbol,withReference?: boolean): boolean {
    if (!(other instanceof LPModel)) { return false; }
    if (withReference) { return this.name == other.name; }
    return false;
  }
  get preview(): string { return ''; }
  get objectivePreview(): string { return this.objective.preview; }

  public getModelized(line: CodeLine): Omit<ILPFormula,'optimizer'|'threshold'> | CompilationError {
    // console.log('MODELIZE',this.appendedValues,line.index);
    const {dict,offset} = this.objective.getParsed();
    const boundList: Bound[] = [];
    const boundValues = this.getValuesBeforeLine(line);
    const urs: string[] = [];
    const binary: string[] = [];
    const integer: string[] = [];
    let castedCount = 0;
    for (const bound of boundValues) {
      if (bound.castableTo('bound')) {
        const parsedBound = bound.castTo('bound').boundize;
        if ('type' in parsedBound) {
          let name: string;
          const nameList = Object.keys(parsedBound.dict);
          if (nameList.length == 0) {
            continue;
          }
          if (nameList.length == 1) {
            name = nameList[0];
          } else {
            name = SimplexSolver.CASTED + castedCount.toFixed();
            const lhs = structuredClone(parsedBound.dict);
            lhs[SimplexSolver.CASTED + (castedCount++).toFixed()] = -1;
            boundList.push({
              lhs: lhs,
              cmp: '=',
              rhs: 0
            });
          }
          if (parsedBound.type == 'bin') {
            binary.push(name);
          } else if (parsedBound.type == 'int') {
            integer.push(name);
          } else if (parsedBound.type == 'urs') {
            urs.push(name);
          }
        } else {
          boundList.push(parsedBound);
        }
      }
    }
    return {
      objective: dict,
      objectiveOffset: offset,
      boundList: boundList,
      urs: urs,
      binary: binary,
      integer: integer
    };
  }
}
class LPModelInator extends BuiltInFunction {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'model','',[
      {name:'obj',types:['alias'],desc:'The value the model will optimize'},
    ],[{type:'model'}]);
  }

  public operate(values: IFunctionInput[]): FunctionResult {
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      return params;
    }
    const alias = params.map.obj.castTo('alias');
    if (!alias.hasVariable) {
      return new CompilationError(ErrorName.Model_NoVariable,alias,alias,'ModelIntator.operate no variable');
    }
    return {
      value: new LPModel(-1,this.line,'',alias),
      warnings: params.warnings
    };
  }
}
class LinearOptimizer extends Macro {
  public constructor(index: number,line: CodeLine,type: 'maximize'|'minimize') {
    super(index,line,type,`Finds the ${type=='maximize'?'maximum':'minimum'} value of a given model`,[
      {name:'lp',types:['model'],desc:'The model to optimize'},
      {name:'thres',types:['num'],desc:'The minimum percentage of the relaxed problem objective value to report',optional:true,default:'1'}
    ]);
  }

  public validate(values: IFunctionInput[]): CompilationError | undefined {
    const params = this.mapParameters(values);
    if (!(params instanceof CompilationError) && 'thres' in params.map) {
      const thres = params.map.thres.castTo('num').value;
      if (thres < 0 || thres > 1) {
        return new CompilationError(ErrorName.Model_InvalidThreshold,params.map.thres,params.map.thres,'LinearOptimizer.validate thres check');
      }
    }
    return super.validate(values);    
  }

  public operate(values: IFunctionInput[],output: OutputLine): void {
    if (output.source == 'proc') {
      return;
    }
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      output.outputMessage(params);
      return;
    }
    const model = params.map.lp.castTo('model');
    const thres = params.map.thres?.castTo('num')?.value ?? 1;
    if (thres < 0 || thres > 1) {
      output.outputMessage(
        new CompilationError(ErrorName.Model_InvalidThreshold,params.map.thres,params.map.thres,'LinearOptimizer.validate thres check')
      );
      return;
    }
    const formula = model.getModelized(output.source);
    if (formula instanceof CompilationError) {
      output.outputMessage(formula);
      return;
    }
    const problem: ILPFormula = {
      ...formula,
      optimizer: this.text as 'minimize',
      threshold: thres
    };
    console.log('PROBLEM',JSON.stringify(problem));
    const result = SimplexSolver.solve(problem);
    if (result instanceof CompilationInfeasible) {
      output.outputMessage(result);
    } else {
      console.log('RESULT',result);
      const table: OutputTableValue = [
        [{value:this.text + ' ' + model.objectivePreview,colspan:3}],
        [{value:'Objective Value: <b>'+SuperMath.renderNumber(result.objectiveValue)+'</b>',colspan:3}],
        [{title:'Variable'},{title:'Value'},{title:'Reduced Cost'}]
      ];
      for (const name in result.values) {
        if (name.includes(SimplexSolver.COND_BINARY) || name.includes(SimplexSolver.INT_BOUND)) {
          continue;
        }
        table.push([
          {value:name},
          {value:SuperMath.renderNumber(result.values[name])},
          {value:SuperMath.renderNumber(result.reducedCost[name])},
        ]);
      }
      table.push([{title:'Row'},{title:'Slack/Surplus'},{title:'Shadow'}]);
      for (const name in result.slacks) {
        table.push([
          {value:name},
          {value:SuperMath.renderNumber(result.slacks[name])},
          {value:SuperMath.renderNumber(result.dual[name])},
        ]);
      }
      output.outputTable(table);
    }
  }
}
class Lindoize extends Macro {
  public constructor(index: number,line: CodeLine) {
    super(index,line,'lindoize','Converts a QUINNDO model object to LINDO code',[
      {name:'lp',types:['model'],desc:'The model to optimize'},
      {name:'type',types:['str'],desc:'Whether to maximinze or minimize - must be one of "max" or "min"'}
    ]);
  }

  public validate(values: IFunctionInput[]): CompilationError | undefined {
    const params = this.mapParameters(values);
    if (!(params instanceof CompilationError)) {
      const type = params.map.type.castTo('str').rawValue;
      if (type != 'max' && type != 'min') {
        return new CompilationError(ErrorName.Model_InvalidOptimizer,params.map.type,params.map.type,'Lindoize.validate');
      }
    }
    return super.validate(values);    
  }

  public operate(values: IFunctionInput[],output: OutputLine): void {
    if (output.source == 'proc') {
      return;
    }
    const valid = this.validate(values);
    if (valid instanceof CompilationError) {
      output.outputMessage(valid);
      return;
    }
    const params = this.mapParameters(values);
    if (params instanceof CompilationError) {
      output.outputMessage(params);
      return;
    }
    const model = params.map.lp.castTo('model');
    const type = params.map.type.castTo('str').rawValue;
    const formula = model.getModelized(output.source);
    if (formula instanceof CompilationError) {
      output.outputMessage(formula);
      return;
    }
    const problem: ILPFormula = {
      ...formula,
      optimizer: type as 'minimize'
    };
    const code = SimplexSolver.lindoize(problem);
    if (code instanceof CompilationInfeasible) {
      output.outputMessage(code);
    } else {
      output.outputText(code);
    }
  }
}

// ~ IMPORTER ~

type SymbolTypeCount = Partial<Record<StorableSymbolType,number>>;
class FrameImporter {
  private static readonly defaultDisplayCount = 5;

  private readonly table: HTMLTableSectionElement;
  private readonly result: IPapaResult;

  private readonly columnCount: number;
  private readonly typeCountByColumn: SymbolTypeCount[] = [];
  private readonly columnNames: (string|null)[];

  private readonly autoFillSelect = document.getElementById('autofill-columns') as HTMLSelectElement;
  private readonly autoAddSelect = document.getElementById('autoadd-columns') as HTMLSelectElement;
  private readonly importButton = document.getElementById('frame-import-button') as HTMLButtonElement;

  private readonly onload: (frame: DataFrame,report:(msg:string,type:MessageType)=>void) => void;

  private displayStart = 0;
  private displayEnd = FrameImporter.defaultDisplayCount;

  public constructor(result: IPapaResult,onload: (frame: DataFrame,report: (msg:string,type:MessageType)=>void) => void) {
    this.result = result;
    let columnCount = 0;
    for (let r = 1; r < result.data.length; r++) {
      const row = result.data[r];
      columnCount = Math.max(row.length,columnCount);
      for (let c = 0; c < row.length; c++) { 
        if (this.typeCountByColumn[c] == undefined) {
          this.typeCountByColumn[c] = {};
        }
        const cellInferredType = Interpreter.inferTypeFromString(row[c]);
        this.typeCountByColumn[c][cellInferredType] = (this.typeCountByColumn[c][cellInferredType] ?? 0) + 1;
      }
    }
    for (let r = 1; r < this.result.data.length; r++) {
      for (let c = 0; c < columnCount; c++) {
        if (this.result.data[r][c] == undefined) {
          this.result.data[r][c] = '';
          this.typeCountByColumn[c].none = (this.typeCountByColumn[c].none ?? 0) + 1;
        }
      }
    }
    
    this.columnNames = new Array(columnCount).fill(null); //build column names
    for (let c = 0; c < result.data[0].length; c++) {
      if (result.data[0][c]?.length > 0) {
        this.columnNames[c] = result.data[0][c];
      }
    }

    const parent = document.getElementById('frame-import-parent')!;
    parent.classList.add('visible');
    const inner = parent.children[0];

    //build import table
    this.table = inner.querySelector('#frame-import-table-parent tbody')!;
    this.table.innerHTML = '';
    const frag = new DocumentFragment();

    const typeRow = document.createElement('tr');
    typeRow.appendChild(document.createElement('th'));
    for (const dict of this.typeCountByColumn) { //add data type row
      const type = FrameImporter.inferColumnType(dict);
      const cell = document.createElement('th');
      cell.textContent = '<' + type + '>';
      cell.classList.add(type);
      typeRow.appendChild(cell);
    }
    frag.appendChild(typeRow);

    const noneRow = document.createElement('tr');
    const missingCell = document.createElement('th');
    missingCell.textContent = 'Missing:';
    noneRow.appendChild(missingCell);
    for (let i = 0; i < result.data[0].length; i++) { //add missing count row
      const cell = document.createElement('th');
      cell.textContent = this.typeCountByColumn[i].none?.toFixed() ?? '0';
      noneRow.appendChild(cell);
    }
    frag.appendChild(noneRow);
    
    const nameRow = document.createElement('tr');
    const indexCol = document.createElement('th');
    indexCol.textContent = '<index>';
    nameRow.appendChild(indexCol);
    for (let c = 0; c < columnCount; c++) {
      const cell = document.createElement('th');
      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add('frame-value-input','column');
      input.value = this.result.data[0][c];
      input.onchange = () => this.onColumnChange(input,c);
      if (this.result.data[0][c] == undefined || this.result.data[0][c].length == 0) {
        input.placeholder = '<none>';
      }
      cell.appendChild(input);
      nameRow.appendChild(cell);
    }
    frag.appendChild(nameRow);

    this.table.appendChild(frag);
    this.columnCount = columnCount;
    this.printRows(1,FrameImporter.defaultDisplayCount);
    document.getElementById('frame-import-row-count')!.textContent = `of ${SuperMath.addCommas(this.result.data.length-1)} rows`;

    const rowSelect = document.getElementById('frame-import-row-select') as HTMLSelectElement;
    rowSelect.innerHTML = '';
    let index = 1;
    let oshlop = 0;
    while (index < result.data.length && oshlop++ < 1e2) {
      const rowOption = document.createElement('option');
      const end = Math.min(index+FrameImporter.defaultDisplayCount-1,result.data.length-1);
      rowOption.textContent = SuperMath.addCommas(index) + "-" + SuperMath.addCommas(end);
      index += FrameImporter.defaultDisplayCount;
      rowSelect.appendChild(rowOption);
    }
    rowSelect.oninput = () => {
      const bounds = rowSelect.value.split('-').map(e => Number(e.replace(/,/g,'')));
      this.printRows(bounds[0],bounds[1]);
    }

    this.autoAddSelect.innerHTML = '';
    this.autoFillSelect.innerHTML = '';
    const autoFrag = new DocumentFragment();
    for (let i = 0; i < this.columnNames.length; i++) {
      const name = this.columnNames[i];
      const columnOption = document.createElement('option');
      columnOption.value = i.toFixed();
      columnOption.textContent = name ?? `<Column ${i+1}>`;
      autoFrag.appendChild(columnOption);
    }
    this.autoAddSelect.appendChild(autoFrag.cloneNode(true));
    this.autoFillSelect.appendChild(autoFrag.cloneNode(true));
    this.clearMessage();
    if (this.columnNames.some(e => e==null)) {
      this.showMessage('Data frame has unnamed columns','error');
      this.importButton.classList.add('disabled');
    } else {
      this.importButton.classList.remove('disabled');
    }

    const fillBtn = document.getElementById('frame-import-fill-button')!;
    fillBtn.onclick = () => this.autoFill(fillBtn);
    this.onload = onload;
    this.importButton.onclick = () => this.import();
  }

  private static inferColumnType(dict: SymbolTypeCount,ignoreNone: boolean = false): StorableSymbolType {
    let firstType: StorableSymbolType | undefined;
    for (const name of keys(dict)) {
      if (dict[name] == undefined) {
        continue;
      }
      if (name == 'none' && ignoreNone) {
        continue;
      }
      if (dict[name]! > 0) {
        if (firstType == undefined) {
          firstType = name;
        } else {
          return 'any';
        }
      }
    }
    if (firstType == 'none') {
      firstType = undefined;
    }
    return firstType ?? 'any';
  }
  
  private printRows(start: number,end: number): void {
    while (this.table.children.length > 3) {
      this.table.lastChild?.remove();
    }
    this.displayStart = start;
    this.displayEnd = end;
    const frag = new DocumentFragment();
    for (let r = start; r <= Math.min(this.result.data.length - 1,end); r++) {
      const row = document.createElement('tr');
      row.setAttribute('data-index',r.toFixed());
      const indexCell = document.createElement('td');
      indexCell.textContent = SuperMath.addCommas(r);
      row.appendChild(indexCell);
      for (let c = 0; c < this.columnCount; c++) {
        const dataCell = document.createElement('td');
        const type = Interpreter.inferTypeFromString(this.result.data[r][c]);
        const input = document.createElement('input');
        input.onchange = () => this.onCellChange(input);
        input.type = 'text';
        input.classList.add('frame-value-input',type);
        input.value = this.result.data[r][c];
        if (this.result.data[r][c] == undefined || this.result.data[r][c].length == 0) {
          input.placeholder = '<none>';
        }
        // dataCell.innerHTML = `<input type="text" class="frame-value-input ${type}" value="${result.data[r][c]}"/>`;
        dataCell.appendChild(input);
        row.appendChild(dataCell);
      }
      frag.appendChild(row);
    }
    this.table.appendChild(frag);
  }

  private onCellChange(input: HTMLInputElement,coordsInData?: {row:number,column:number}): void {
    let rowIndex = coordsInData?.row;
    let columnIndex = coordsInData?.column;
    if (rowIndex == undefined || columnIndex == undefined) {
      const row = input.parentElement?.parentElement;
      const rowIndexAttr = row?.getAttribute('data-index');
      if (row == undefined || rowIndexAttr == undefined) {
        this.showMessage('Cell value could not be changed','error');
        return;
      }
      columnIndex = Array.from(row.children).indexOf(input.parentElement!) - 1;
      if (columnIndex < 0) {
        this.showMessage('Cell value could not be changed','error');
        return;
      }
      rowIndex = Number(rowIndexAttr);
    }
    
    const origColumnType = FrameImporter.inferColumnType(this.typeCountByColumn[columnIndex]);
    const originalDataType = Interpreter.inferTypeFromString(this.result.data[rowIndex][columnIndex]);
    const finalDataType = Interpreter.inferTypeFromString(input.value);
    input.classList.remove(originalDataType);
    input.classList.add(finalDataType);
    this.typeCountByColumn[columnIndex][originalDataType]!--;
    this.typeCountByColumn[columnIndex][finalDataType] = (this.typeCountByColumn[columnIndex][finalDataType] ?? 0) + 1;
    const finalColumnType = this.updateColumnTypeDisplay(columnIndex);

    this.result.data[rowIndex][columnIndex] = input.value;

    if (originalDataType == 'none' && finalDataType != 'none') {
      input.placeholder = '';
    }
    if (originalDataType != 'none' && finalDataType == 'none') {
      input.placeholder = '<none>';
    }
    if (origColumnType != 'any' && finalColumnType == 'any') {
      this.showMessage('This value does not match the preexisting values','warning');
      return;
    }
    this.clearMessage();
  }
  private onColumnChange(input: HTMLInputElement,index: number): void {
    const newColumnName = input.value;
    if (this.columnNames.includes(newColumnName)) {
      this.showMessage('Data frames cannot have duplicate column names','error');
      input.value = '';
      input.placeholder = '<none>';
      return;
    }
    input.placeholder = '';
    this.columnNames[index] = newColumnName;
    this.autoAddSelect.children[index].textContent = newColumnName;
    this.autoFillSelect.children[index].textContent = newColumnName;
    this.clearMessage();
  }
  private updateColumnTypeDisplay(columnIndex: number): StorableSymbolType {
    const type = FrameImporter.inferColumnType(this.typeCountByColumn[columnIndex] ?? {});
    const typeRow = this.table.children[0];
    typeRow.children[columnIndex + 1].textContent = '<' + type + '>';
    typeRow.children[columnIndex + 1].className = type;
    return type;
  }
  private updateValueAtPosition(row: number,column: number,value: string): void {
    const type = Interpreter.inferTypeFromString(value);
    if (row >= this.displayStart && row <= this.displayEnd) { //update input
      const input = this.table.rows[row-this.displayStart+3].cells[column+1].children[0] as HTMLInputElement;
      input.value = value;
      this.onCellChange(input,{row:row,column:column});
    } else {
      this.result.data[row][column] = value;
      this.typeCountByColumn[column].none!--;
      this.typeCountByColumn[column][type!] = (this.typeCountByColumn[column][type!] ?? 0) + 1;
    }
  }

  private import(): void {
    if (this.columnNames.some(e => e==null)) {
      this.showMessage('Data frame has unnamed columns','error');
      this.importButton.classList.add('disabled');
      return;
    }
    const frameName = (document.getElementById('frame-import-name') as HTMLInputElement)?.value;
    if (frameName == undefined || frameName.length == 0) {
      this.showMessage('Data frame is still unnamed','error');
      this.importButton.classList.add('disabled');
      return;
    }
    const vectors: AbstractVector[] = [];
    const line = CodeLine.Unlinked();
    for (let c = 0; c < this.columnCount; c++) {
      const vectorValues: AbstractStorable[] = [];
      for (let r = 1; r < this.result.data.length; r++) {
        vectorValues.push(Interpreter.inferStorableFromString(this.result.data[r][c],line));
      }
      const columnVector = GenericVector.FromArray(vectorValues,line);
      if (columnVector instanceof CompilationError) {
        this.showMessage('Error when importing column ' + this.columnNames[c],'error');
        this.importButton.classList.add('disabled');
        return;
      }
      vectors.push(columnVector);
    }
    const frame = new DataFrame(-1,line,vectors,frameName,this.columnNames as string[],frameName);
    this.onload(frame,this.showMessage);
  }

  private clearMessage(): void {
    document.getElementById('frame-import-message')!.innerHTML = '';
    document.getElementById('frame-import-button')!.classList.remove('disabled');
  }
  private showMessage(message: string,messageType: MessageType): void {
    const svg = Interpreter.createSVG(Interpreter.messageIconPaths[messageType],messageType,messageType);
    const output = document.getElementById('frame-import-message')!;
    output.innerHTML = '';
    output.className = messageType;
    output.appendChild(svg);
    const span = document.createElement('span');
    span.textContent = message;
    output.appendChild(span);
    if (messageType == 'error') {
      this.importButton.classList.add('disabled');
    }
  }

  private autoFill(btn: HTMLElement): void {
    const type = (btn.previousElementSibling as HTMLSelectElement)?.value;
    const column = (btn.previousElementSibling?.previousElementSibling as HTMLSelectElement)?.value;
    if (column == '' || column == undefined || type == undefined) {
      this.showMessage('Value could not be autofilled','error');
      return;
    }
    if (type == 'forward') {
      this.forwardFill(Number(column));
    } else if (type == 'backward') {
      this.backwardFill(Number(column));
    } else if (type == 'most_common') {
      this.mostCommon(Number(column));
    } else if (type == 'default_value') {
      this.defaultValue(Number(column));
    } else if (type == 'average') {
      this.average(Number(column));
    } else if (type == 'interpolate') {
      this.interpolate(Number(column));
    }
    this.updateColumnTypeDisplay(Number(column));
  }
  private forwardFill(columnIndex: number): void {
    this.typeCountByColumn[columnIndex].none ??= 0;
    let carryingValue: string | undefined;
    for (let r = 1; r < this.result.data.length; r++) {
      if (this.result.data[r][columnIndex] != '') {
        carryingValue = this.result.data[r][columnIndex];
      } else if (carryingValue != undefined) {
        this.updateValueAtPosition(r,columnIndex,carryingValue);
      }
    }
    this.clearMessage();
  }
  private backwardFill(columnIndex: number): void {
    this.typeCountByColumn[columnIndex].none ??= 0;
    let carryingValue: string | undefined;
    for (let r = this.result.data.length - 1; r > 0; r--) {
      if (this.result.data[r][columnIndex] != '') {
        carryingValue = this.result.data[r][columnIndex];
      } else if (carryingValue != undefined) {
        this.updateValueAtPosition(r,columnIndex,carryingValue);
      }
    }
    this.clearMessage();
  }
  private mostCommon(columnIndex: number): void {
    const counts: Record<string,number> = {};
    for (let r = 1; r < this.result.data.length; r++) {
      const val = this.result.data[r][columnIndex];
      if (val.length > 0) {
        counts[val] = (counts[val] ?? 0) + 1;
      }
    }
    let mostCommonValue: string | undefined;
    let mostCommonFreq = 0;
    for (const key in counts) {
      if (counts[key] > mostCommonFreq) {
        mostCommonValue = key;
        mostCommonFreq = counts[key];
      }
    }
    if (mostCommonValue == undefined) {
      this.showMessage('No value in column','warning');
      return;
    }
    for (let r = 1; r < this.result.data.length; r++) {
      if (this.result.data[r][columnIndex].length == 0) {
        this.updateValueAtPosition(r,columnIndex,mostCommonValue);
      }
    }
  }
  private defaultValue(columnIndex: number): void {
    const type = FrameImporter.inferColumnType(this.typeCountByColumn[columnIndex],true);
    if (type != 'bool' && type != 'str' && type != 'num') {
      this.showMessage('Cannot coerce column to one valid type','error');
      return;
    }
    const fill = type=='bool' ? 'false' : type=='num' ? '0' : ' ';
    for (let r = 1; r < this.result.data.length; r++) {
      if (this.result.data[r][columnIndex].length == 0) {
        this.updateValueAtPosition(r,columnIndex,fill);
      }
    }
    this.clearMessage();
  }
  private average(columnIndex: number): void {
    const type = FrameImporter.inferColumnType(this.typeCountByColumn[columnIndex],true);
    if (type != 'date' && type != 'num') {
      this.showMessage('Cannot coerce column to one valid type','error');
      return;
    }
    let total = 0;
    let count = 0;
    for (let r = 1; r < this.result.data.length; r++) {
      const val = this.result.data[r][columnIndex];
      if (val.length > 0) {
        count++;
        total += type=='num' ? Number(val.replace(/_/g,'')) : DateStringInator.parse(val)!.date.getTime();
      }
    }
    if (count == 0) {
      this.showMessage('There are no values to average','error');
      return;
    }
    const average = total / count;
    const averageString = type=='num' ? String(Math.round(average*1e3)/1e3) :
      new Date(average).toISOString().replace('T',' ').slice(0,-5);
    for (let r = 1; r < this.result.data.length; r++) {
      if (this.result.data[r][columnIndex].length == 0) {
        this.updateValueAtPosition(r,columnIndex,averageString);
      }
    }
    this.updateColumnTypeDisplay(columnIndex);
  }
  private interpolate(columnIndex: number): void {
    const type = FrameImporter.inferColumnType(this.typeCountByColumn[columnIndex],true);
    if (type != 'date' && type != 'num') {
      this.showMessage('Cannot coerce column to one valid type','error');
      return;
    }
    function stringify(num: number): string {
      return type=='num' ? String(Math.round(num*1e3)/1e3) :
        new Date(num).toISOString().replace('T',' ').slice(0,-5);
    }
    const indexOfDefinedValues: number[] = [];
    for (let r = 1; r < this.result.data.length; r++) {
      if (this.result.data[r][columnIndex].length > 0) {
        indexOfDefinedValues.push(r);
      }
    }
    for (let i = 0; i < indexOfDefinedValues.length - 1; i++) {
      const startIndex = indexOfDefinedValues[i];
      const endIndex = indexOfDefinedValues[i+1];
      if (endIndex - startIndex <= 1) {
        continue;
      }
      const startValue = type=='num' ? Number(this.result.data[startIndex][columnIndex].replace(/_/g,'')) :
        DateStringInator.parse(this.result.data[startIndex][columnIndex])!.date.getTime();
      const endValue = type=='num' ? Number(this.result.data[endIndex][columnIndex].replace(/_/g,'')) :
        DateStringInator.parse(this.result.data[endIndex][columnIndex])!.date.getTime();
      if (endIndex - startIndex == 2) {
        this.updateValueAtPosition(startIndex+1,columnIndex,stringify((startValue+endValue)/2));
        continue;
      }
      const slope = (endValue - startValue) / (endIndex - startIndex);
      const intercept = startValue - slope * startIndex;
      for (let a = startIndex + 1; a < endIndex; a++) {
        this.updateValueAtPosition(a,columnIndex,stringify(slope * a + intercept));
      }
    }
  }
}

// ~ HELPER CLASSES ~

class ReplaceableString {
  private readonly str: string;
  private readonly replacements: ({original:string,replacement:string}|{movePastSpaces:true})[] = [];

  public constructor(str: string) {
    this.str = str;
  }

  public replace(original: string,replacement: string): void {
    this.replacements.push({original:original,replacement:replacement});
  }
  public movePastSpaces(): void {
    this.replacements.push({movePastSpaces:true});
  }

  public toString(enforceCase: boolean = false): string {
    let ret = this.str;
    let leftOffset = 0;
    for (const rep of this.replacements) {
      if ('movePastSpaces' in rep) {
        while (ret.charAt(leftOffset) == ' ' || ret.charAt(leftOffset) == '\u00a0') {
          leftOffset++;
        }
        continue;
      }
      const secondHalf = ret.slice(leftOffset);
      if (rep.original.length == 0) {
        ret = ret.slice(0,leftOffset) + rep.replacement + ret.slice(leftOffset);
        leftOffset += rep.replacement.length;
        continue;
      }
      const index = enforceCase?secondHalf.indexOf(rep.original):secondHalf.toLowerCase().indexOf(rep.original.toLowerCase());
      if (index == -1) {
        continue;
      }
      ret = ret.slice(0,leftOffset) + secondHalf.slice(0,index) + rep.replacement + secondHalf.slice(index+rep.original.length);
      leftOffset += index + rep.replacement.length;
    }
    return ret;
  }
}
class CodeLine {
  public readonly uuid = Math.floor(Math.random() * 16 ** 8).toString(16).padStart(8,'0');
  private readonly anchor: HTMLElement;
  private readonly messageDiv: HTMLElement;
  private readonly codeDiv: HTMLElement;
  private currentIndex: number;

  public constructor(parent: Element | null,index: number,insertBefore?: CodeLine) {
    this.currentIndex = index;

    this.anchor = document.createElement('div');
    this.anchor.classList.add('code-row','active');
    //line number
    const lineNumber = document.createElement('div');
    lineNumber.textContent = (this.currentIndex+1).toFixed();
    lineNumber.classList.add('line-number');
    this.anchor.appendChild(lineNumber);
    //messages
    this.messageDiv = document.createElement('div');
    this.messageDiv.classList.add('message-cont');
    this.anchor.appendChild(this.messageDiv);
    //actual line of code
    this.codeDiv = document.createElement('div');
    this.codeDiv.setAttribute('autocomplete','off');
    this.codeDiv.setAttribute('autocorrect','off');
    this.codeDiv.setAttribute('autocapitalize','off');
    this.codeDiv.setAttribute('spellcheck','false');
    this.codeDiv.setAttribute('contentEditable','true');
    this.codeDiv.classList.add('code-line');
    this.codeDiv.onblur = () => this.anchor.classList.remove('active');
    this.codeDiv.onfocus = () => this.anchor.classList.add('active');
    this.anchor.appendChild(this.codeDiv);

    if (parent) {
      parent.insertBefore(this.anchor,insertBefore?.anchor ?? null);
    }
  }

  public static Unlinked() { return new CodeLine(null,-1); }
  
  private static getAllTextNodes(node: Node): Text[] {
    const textNodes: Text[] = [];

    function traverse(node: Node): void {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
      } else {
        const childNodes = node.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          traverse(childNodes[i]);
        }
      }
    }

    traverse(node);
    return textNodes;
  }

  public blur(): void { this.codeDiv.blur(); }
  public focus(): void { this.codeDiv.focus(); }

  public clone(parent: Element,index: number,insertBefore?: CodeLine): CodeLine {
    const cloned = new CodeLine(parent,index,insertBefore);
    cloned.anchor.classList.remove('active');
    cloned.messageDiv.innerHTML = this.messageDiv.innerHTML;
    cloned.codeDiv.innerHTML = this.codeDiv.innerHTML;
    return cloned;
  }
  public matches(elem: Element): boolean {
    return this.anchor == elem || this.messageDiv == elem || this.codeDiv == elem;
  }

  public remove(): void {
    this.anchor.remove();
  }
  public moveAbove(parent: Element,other?: CodeLine): void {
    parent.insertBefore(this.anchor,other?.anchor ?? null);
  }
  public moveBelow(parent: Element,other?: CodeLine): void {
    if (other) {
      parent.insertBefore(other.anchor,this.anchor);
    }
  }
  public getBoundingDictOfNthChild(n: number): DOMRect | undefined {
    const children: Element[] = [];
    for (const child of this.codeDiv.children) {
      if (child.classList.contains('error') || child.classList.contains('warning') || child.classList.contains('recommendation')) {
        for (const grandchild of child.children) {
          children.push(grandchild);
        }
      } else {
        children.push(child);
      }
      if (children.length > n) {
        break;
      }
    }
    return children[n]?.getBoundingClientRect();
  }

  public clearMessages(): void {
    this.messageDiv.innerHTML = '';
  }
  public updateMessages(messageList: CompilationMessage[]): void {
    if (messageList.length >= 4) {
      this.messageDiv.append( Interpreter.messageSymbol(messageList[0],'top-left') );
      this.messageDiv.append( Interpreter.messageSymbol(messageList[1],'top-right') );
      this.messageDiv.append( Interpreter.messageSymbol(messageList[2],'bottom-left') );
      this.messageDiv.append( Interpreter.messageSymbol(messageList[3],'bottom-right') );
    } else if (messageList.length == 3) {
      this.messageDiv.append( Interpreter.messageSymbol(messageList[0],'top-center') );
      this.messageDiv.append( Interpreter.messageSymbol(messageList[1],'bottom-left') );
      this.messageDiv.append( Interpreter.messageSymbol(messageList[2],'bottom-right') );
    } else if (messageList.length == 2) {
      this.messageDiv.append( Interpreter.messageSymbol(messageList[0],'top-center') );
      this.messageDiv.append( Interpreter.messageSymbol(messageList[1],'bottom-right') );
    } else if (messageList.length == 1) {
      this.messageDiv.append( Interpreter.messageSymbol(messageList[0],'center') );
    } else {
      this.messageDiv.innerHTML = '';
    }
  }

  get isEmpty(): boolean {
    return this.codeDiv.innerText.replace(/ /g,'').replace(/\n/g,'').length == 0;
  }
  get isActive(): boolean { return this.anchor.classList.contains('active'); }
  get text(): string { return this.codeDiv.textContent ?? ''; }
  set text(text: string) { this.codeDiv.textContent = text; }
  get html(): string { return this.codeDiv.innerHTML ?? ''; }
  set html(html: string) { this.codeDiv.innerHTML = html; }

  get hasError(): boolean {
    return this.codeDiv.previousElementSibling!.querySelectorAll('.error-message').length > 0;
  }
  get hasWarning(): boolean {
    return this.codeDiv.previousElementSibling!.querySelectorAll('.warning-message').length > 0;
  }
  get hasRecommendation(): boolean {
    return this.codeDiv.previousElementSibling!.querySelectorAll('.recommendation-message').length > 0;
  }

  get index(): number {
    return this.currentIndex;
  }
  set index(index: number) {
    this.currentIndex = index;
    this.anchor.children[0].textContent = (index+1).toFixed();
  }

  get caretPosition(): {start:number;end:number;} {
    const selection = window.getSelection()!;
    const range = selection.getRangeAt(0);
    let start = 0;
    let end = 0;
    for (const node of CodeLine.getAllTextNodes(this.codeDiv)) {
      if (node == range.startContainer) {
        start += range.startOffset;
        break;
      } else {
        start += node.length;
      }
    }
    for (const node of CodeLine.getAllTextNodes(this.codeDiv)) {
      if (node == range.endContainer) {
        end += range.endOffset;
        break;
      } else {
        end += node.length;
      }
    }
    return {start,end};
  }
  set caretPosition(pos: {start:number,end:number}) {
    let startDict: {node:Text,index:number} | undefined;
    let endDict: {node:Text,index:number} | undefined;
    let startCounter = pos.start;
    let endCounter = pos.end;
    for (const node of CodeLine.getAllTextNodes(this.codeDiv)) {
      if (startCounter <= node.length) {
        startDict ??= {node:node,index:startCounter};
        startCounter = 0;
      } else {
        startCounter -= node.length;
      }
      if (endCounter <= node.length) {
        endDict ??= {node:node,index:endCounter};
        endCounter = 0;
      } else {
        endCounter -= node.length;
      }
      if (startDict && endDict) {
        break;
      }
    }
    if (startDict && endDict) {
      const selection = window.getSelection();
      const range = new Range();
      try {
        range.setStart(startDict.node,startDict.index);
        range.setEnd(endDict.node,endDict.index);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch(e) {
        console.error('Could not set position to',pos);
      }
    }
  }

  set onkeydown(fxn: ((ev: KeyboardEvent) => void) | null) {
    this.codeDiv.onkeydown = fxn;
  }
}
interface IOutputTableHeader {
  title: string,
  colspan?: number
}
interface IOutputTableCell {
  value: string | number,
  colspan?: number
}
type OutputTableValue = (IOutputTableCell|IOutputTableHeader)[][];
class OutputLine {
  public readonly source: CodeLine | 'proc';
  private readonly anchor: HTMLDivElement;
  private readonly box: HTMLDivElement;
  private valueCount = 0;

  public constructor(source: CodeLine | 'proc') {
    this.source = source;
    this.anchor = document.createElement('div');
    this.anchor.classList.add('output-row');
    const lineNumber = document.createElement('div');
    lineNumber.classList.add('line-number');
    this.anchor.appendChild(lineNumber);
    this.box = document.createElement('div');
    this.box.classList.add('output-box');
    this.anchor.appendChild(this.box);
  }

  public outputText(text: string,messageType?: MessageType): void {
    this.valueCount++;
    const textBox = document.createElement('div');
    textBox.classList.add('output-line');
    if (messageType) {
      textBox.classList.add(messageType);
    }
    textBox.innerHTML = text.replace('\n','<br>').replace(/\u000a/g,'<br>');
    this.box.appendChild(textBox);
  }
  public outputMessage(message: CompilationMessage): void {
    this.outputText(message.toString(),message.type);
  }

  public outputTable(tableValues: OutputTableValue): void {
    this.valueCount++;
    const parent = document.createElement('div');
    parent.classList.add('output-table-parent');

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    for (const rowValues of tableValues) {
      const row = document.createElement('tr');
      for (const cellValue of rowValues) {
        const cell = document.createElement('title' in cellValue ? 'th' : 'td');
        const text = 'title' in cellValue ? cellValue.title : cellValue.value;
        cell.innerHTML = typeof text == 'string' ? text : SuperMath.renderNumber(text);
        if (cellValue.colspan) {
          cell.setAttribute('colspan',cellValue.colspan.toFixed());
        }
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    parent.appendChild(table);
    this.box.appendChild(parent);
  }

  public outputDocument(doc: Document): void {
    this.valueCount++;

    const parentBox = document.createElement('div');
    parentBox.classList.add('output-graph-parent');

    const controlsRow = document.createElement('div');
    controlsRow.classList.add('output-graph-controls');
    parentBox.appendChild(controlsRow);

    parentBox.appendChild(doc.documentElement);

    this.box.appendChild(parentBox);
  }

  get count(): number { return this.valueCount; }
  get hasContent(): boolean { return this.valueCount > 0; }

  public appendTo(other: Element) {
    this.anchor.children[0].textContent = this.source=='proc'?this.source.toUpperCase():(this.source.index+1) + '>';
    other.appendChild(this.anchor);
  }
}
interface INodePath<T> {
  weight: number,
  path: T[]
}
interface INodeLayout2<T> extends IVector {
  readonly node: T;
  readonly isSource: boolean;
  readonly isSink: boolean;
}
class DiGraph<T> {
  private readonly adjacencyMap = new Map<T,Map<T,number>>();
  private readonly sourceSet = new Set<T>();
  private readonly sinkSet = new Set<T>();

  private smallestWeightCache: number | undefined;
  
  public static getAllSubsets<T>(list: T[]): T[][] {
    const result: T[][] = [];
  
    function generateSubsets(index: number, currentSubset: T[]): void {
      result.push(currentSubset.slice());
  
      for (let i = index; i < list.length; i++) {
        currentSubset.push(list[i]);
        generateSubsets(i + 1, currentSubset);
        currentSubset.pop();
      }
    }
  
    generateSubsets(0,[]);
  
    return result;
  }

  get smallestWeight(): number {
    if (this.smallestWeightCache) {
      return this.smallestWeightCache;
    }
    let smallestWeight = 0;
    for (const maps of this.adjacencyMap.values()) {
      for (const weight of maps.values()) {
        if (weight < smallestWeight) {
          smallestWeight = weight;
        }
      }
    }
    this.smallestWeightCache = smallestWeight;
    return smallestWeight;
  }

  public addVertex(vertex: T): void {
    if (!this.adjacencyMap.has(vertex)) {
      this.adjacencyMap.set(vertex,new Map());
    }
  }
  public addEdge(start: T,end: T,weight: number = 1): void {
    this.addVertex(start);
    this.addVertex(end);
    this.smallestWeightCache = undefined;
    this.adjacencyMap.get(start)!.set(end,weight);
  }

  public setAsSource(vertex: T): void {
    this.addVertex(vertex);
    this.sourceSet.add(vertex);
  }
  public checkAsSource(vertex: T): boolean {
    return this.sourceSet.has(vertex);
  }
  public deleteAsSource(vertex: T): void {
    this.sourceSet.delete(vertex);
  }

  public setAsSink(vertex: T): void {
    this.addVertex(vertex);
    this.sinkSet.add(vertex);
  }
  public checkAsSink(vertex: T): boolean {
    return this.sinkSet.has(vertex);
  }
  public deleteAsSink(vertex: T): void {
    this.sinkSet.delete(vertex);
  }

  public hasVertex(vertex: T): boolean {
    return this.adjacencyMap.has(vertex);
  }
  public hasEdge(start: T,end: T): boolean {
    return this.adjacencyMap.get(start)?.has(end) ?? false;
  }
  public getWeight(start: T,end: T): number | undefined {
    return this.adjacencyMap.get(start)?.get(end);
  }
  
  public deleteEdge(start: T,end: T): void {
    this.smallestWeightCache = undefined;
    this.adjacencyMap.get(start)?.delete(end);
  }
  public deleteVertex(vertex: T): void {
    if (this.hasVertex(vertex)) {
      this.smallestWeightCache = undefined;
      this.adjacencyMap.delete(vertex);
      for (const neighbors of this.adjacencyMap.values()) {
        neighbors.delete(vertex);
      }
    }
  }

  public deleteEdgesFromVertex(vertex: T): void {
    this.smallestWeightCache = undefined;
    this.adjacencyMap.set(vertex,new Map());
  }
  public deleteEdgesToVertex(vertex: T): void {
    this.smallestWeightCache = undefined;
    for (const vertexMap of this.adjacencyMap.values()) {
      vertexMap.delete(vertex);
    }
  }

  public getNeighbors(vertex: T): Iterable<T> | undefined {
    return this.adjacencyMap.get(vertex)?.keys();
  }
  public getAntiNeighbors(vertex: T): T[] | undefined {
    if (!this.adjacencyMap.has(vertex)) {
      return undefined;
    }
    const sources: T[] = [];
    for (const [V,neighbors] of this.adjacencyMap.entries()) {
      if (neighbors.has(vertex)) {
        sources.push(V);
      }
    }
    return sources;
  }
  public getVertices(): Iterable<T> {
    return this.adjacencyMap.keys();
  }
  public *getEdges(): Iterable<[T,T,number]> {
    for (const key of this.adjacencyMap.keys()) {
      for (const neighbor of this.adjacencyMap.get(key)?.keys() ?? []) {
        yield [key,neighbor,this.adjacencyMap.get(key)!.get(neighbor)!];
      }
    }
  }
  get vertexCount(): number { return this.adjacencyMap.size; }
  get edgeCount(): number {
    let total = 0;
    for (const vertex of this.adjacencyMap.keys()) {
      total += this.adjacencyMap.get(vertex)?.size ?? 0;
    }
    return total;
  }

  public getInDegree(vertex: T): number {
    return this.getAntiNeighbors(vertex)?.length ?? 0;
  }
  public getOutDegree(vertex: T): number {
    return this.getAntiNeighbors(vertex)?.length ?? 0;
  }
  public getDegree(vertex: T): number {
    return this.getInDegree(vertex) + this.getOutDegree(vertex);
  }

  public traverse(anchor: T): Map<T,INodePath<T>> | null {
    if (!this.hasVertex(anchor)) {
      return new Map();
    }
    const smallestWeight = this.smallestWeight;
    const edgeAddingValue = this.smallestWeight<0?-smallestWeight:0;

    function comparePaths(a: INodePath<T>,b: INodePath<T>): number {
      if (edgeAddingValue == 0 || a.path.length == b.path.length) {
        return a.weight - b.weight;
      } else if (a.path.length > b.path.length) {
        return a.weight - edgeAddingValue * (a.path.length - b.path.length) - b.weight;
      } else {
        return a.weight - b.weight + edgeAddingValue * (b.path.length - a.path.length);
      }
    }

    const visitedNodes: Set<T> = new Set([anchor]);
    const distanceMap: Map<T,INodePath<T>> = new Map([
      [anchor,{weight:0,path:[]}]
    ]);
    for (const neighbor of this.getNeighbors(anchor)!) {
      distanceMap.set(neighbor,{
        weight: this.adjacencyMap.get(anchor)!.get(neighbor)! + edgeAddingValue,
        path: [anchor],
      });
    }
    let currentNode: T = anchor;
    while (currentNode != undefined) {
      let nextNode: T | undefined;
      let nextWeight: INodePath<T> = {weight:Infinity,path:[]};
      for (const [node,pathDict] of distanceMap.entries()) {
        if (!visitedNodes.has(node) && distanceMap.has(node) && comparePaths(pathDict,nextWeight) < 0) {
          nextNode = node;
          nextWeight = pathDict;
        }
      }
      if (nextNode == undefined) {
        break;
      }
      for (const neighbor of this.getNeighbors(nextNode)!) {
        if (edgeAddingValue == 0 && visitedNodes.has(neighbor)) {
          continue;
        }
        const nextPath = {
          weight: this.adjacencyMap.get(nextNode)!.get(neighbor)! + edgeAddingValue + nextWeight.weight,
          path: [...nextWeight.path,nextNode]
        };
        if (nextPath.path.includes(neighbor)) {
          return null;
        }
        if (!distanceMap.has(neighbor) || comparePaths(nextPath,distanceMap.get(neighbor)!) < 0) {
          distanceMap.set(neighbor,nextPath);
        }
      }
      visitedNodes.add(nextNode);
      currentNode = nextNode;
    }
    if (edgeAddingValue > 0) {
      for (const pathDict of distanceMap.values()) {
        pathDict.weight -= edgeAddingValue * pathDict.path.length;
      }
    }
    return distanceMap;
  }
  public getAllCuts(): [T,T][][] {
    const source = Array.from(this.sourceSet);
    const sink = Array.from(this.sinkSet);
    const between = Array.from(this.adjacencyMap.keys()).filter(e => !source.includes(e) && !sink.includes(e));
    const cutList: [T,T][][] = [];
    for (const betweenSet of DiGraph.getAllSubsets(between)) {
      const iterCuts: [T,T][] = [];
      const V_prime = [...sink,...betweenSet];
      const V: T[] = [];
      for (const vertex of this.getVertices()) {
        if (!V_prime.includes(vertex)) {
          V.push(vertex);
        }
      }
      for (let i = 0; i < V.length; i++) {
        for (let j = 0; j < V_prime.length; j++) {
          if (this.hasEdge(V[i],V_prime[j])) {
            iterCuts.push([V[i],V_prime[j]]);
          }
        }
      }
      if (iterCuts.length > 0) {
        cutList.push(iterCuts);
      }
    }
    return cutList;
  }
  public getMaxFlow(): number | null {
    const cuts = this.getAllCuts();
    if (cuts.length == 0) {
      return null;
    }
    let minimum = Infinity;
    for (const cut of cuts) {
      let totalFlow = 0;
      for (const arc of cut) {
        totalFlow += this.getWeight(arc[0],arc[1])!;
      }
      minimum = Math.min(minimum,totalFlow);
    }
    if (minimum == Infinity) {
      return null;
    }
    return minimum;
  }
  
  public findCycle(): T[] | null {
    for (const [vertex,neighbors] of this.adjacencyMap.entries()) {
      if (neighbors.has(vertex)) {
        return [vertex,vertex];
      }
    }

    const visited: Map<T,boolean> = new Map();
    const recursionStack: Map<T, boolean> = new Map();
    const path: T[] = [];

    const dfs = (vertex: T): T[] | null => {
      visited.set(vertex, true);
      recursionStack.set(vertex, true);
      path.push(vertex);

      const neighbors = this.getNeighbors(vertex) || [];

      for (const neighbor of neighbors) {
        if (!visited.get(neighbor)) {
          const result = dfs(neighbor);
          if (result) {
            return result;
          }
        } else if (recursionStack.get(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          return path.slice(cycleStart);
        }
      }

      recursionStack.set(vertex, false);
      path.pop();

      return null;
    };

    for (const vertex of this.getVertices()) {
      if (!visited.get(vertex)) {
        const cyclePath = dfs(vertex);
        if (cyclePath) {
          return cyclePath;
        }
      }
    }

    return null;
  }
  public hasPath(start: T,end: T): boolean {
    const visited: Map<T,boolean> = new Map();

    const dfs = (current: T): boolean => {
      if (current === end) {
        return true;
      }

      visited.set(current,true);

      const neighbors = this.getNeighbors(current) ?? [];

      for (const neighbor of neighbors) {
        if (!visited.get(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        }
      }

      return false;
    };

    return dfs(start);
  }
  public hasPathThrough(start: T,midpoint: T,end: T): boolean {
    return this.hasPath(start,midpoint) && this.hasPath(midpoint,end);
  }
  public getAllPaths(start: T,end: T): T[][] {
    const paths: T[][] = [];
    const visited = new Set<T>();

    const dfs = (current: T, path: T[]): void => {
      visited.add(current);
      path.push(current);

      if (current === end) {
        paths.push([...path]);
      } else {
        const neighbors = this.adjacencyMap.get(current) || new Map();

        for (const [neighbor, _] of neighbors) {
          if (!visited.has(neighbor)) {
            dfs(neighbor, path);
          }
        }
      }

      visited.delete(current);
      path.pop();
    };

    dfs(start, []);

    return paths;
  }

  get emptyClone(): DiGraph<T> { return new DiGraph(); }

  public clone(): DiGraph<T> {
    function cloneMap(map: Map<T,number>): Map<T,number> {
      const copy = new Map<T,number>();
      for (const [key,value] of map.entries()) {
        copy.set(key,value);
      }
      return copy;
    }
    const clone = this.emptyClone;
    for (const [key,value] of this.adjacencyMap.entries()) {
      clone.adjacencyMap.set(key,cloneMap(value));
    }
    clone.smallestWeightCache = this.smallestWeightCache;
    for (const source of this.sourceSet) {
      clone.sourceSet.add(source);
    }
    for (const sink of this.sinkSet) {
      clone.sinkSet.add(sink);
    }
    return clone;
  }
  public print(): void { console.log(this.adjacencyMap); }

  public layout(): INodeLayout2<T>[] {
    const ATTRACTION = 0.015;
    const REPULSION = -0.01;
    const DELTA = 0.05;

    const layoutList: INodeLayout2<T>[] = [];
    const gridLayout = SuperVector.gridify(this.adjacencyMap.size - this.sourceSet.size - this.sinkSet.size);
    const gridPositions: IVector2[] = [];
    for (let c = 0; c < gridLayout.length; c++) {
      for (let r = 0; r < gridLayout[c]; r++) {
        gridPositions.push({
          x: (c+1)/(gridLayout.length+1) * SuperRandom.randRange(0.95,1.05),
          y: (r+1)/(gridLayout[c]+1) * SuperRandom.randRange(0.95,1.05)
        });
      }
    }
    gridPositions.sort((a,b) => SuperVector.distance(a,{x:0.5,y:0.5}) - SuperVector.distance(b,{x:0.5,y:0.5}));
    let sourceCount = 0;
    let sinkCount = 0;
    let middleCount = 0;
    const degreeMap = new Map<T,number>();
    for (const node of this.adjacencyMap.keys()) {
      degreeMap.set(node,this.getDegree(node));
    }
    const sortedNodes = Array.from(this.adjacencyMap.keys()).sort((a,b) => degreeMap.get(b)! - degreeMap.get(a)!);
    for (const node of sortedNodes) {
      if (this.sourceSet.has(node)) {
        layoutList.push({
          node: node,
          isSink: false,
          isSource: true,
          x: 0,
          y: (sourceCount+1)/(this.sourceSet.size+1)
        });
        sourceCount++;
      } else if (this.sinkSet.has(node)) {
        layoutList.push({
          node: node,
          isSink: true,
          isSource: false,
          x: 1,
          y: (sinkCount+1)/(this.sinkSet.size+1)
        });
        sinkCount++;
      } else {
        layoutList.push({
          node: node,
          isSink: false,
          isSource: false,
          ...gridPositions[middleCount]
        });
        middleCount++;
      }
    }

    let oshlop = 0;
    while (oshlop++ < 19 && sortedNodes.length > 0) {
      const forceList = new Array(sortedNodes.length).fill(null).map(e => { return {x:0,y:0}; });
      for (let i = 0; i < sortedNodes.length; i++) {
        for (let j = i + 1; j < sortedNodes.length; j++) {
          const A = layoutList[i];
          const B = layoutList[j];
          const hasCommonEdge = (this.adjacencyMap.get(A.node)?.has(B.node) || this.adjacencyMap.get(B.node)?.has(A.node));
          const vector = SuperVector.difference(A,B);
          const force = {x:0,y:0};
          if (hasCommonEdge) {
            const attractionScalar = ATTRACTION * SuperVector.magnitude(vector);
            force.x += attractionScalar * vector.x;
            force.y += attractionScalar * vector.y;
          }
          if (vector.x > Number.EPSILON || vector.y > Number.EPSILON) {
            const repulsionScalar = REPULSION / (SuperVector.magnitude(vector) ** 2);
            force.x += repulsionScalar * vector.x;
            force.y += repulsionScalar * vector.y;
          }
          forceList[i].x += force.x;
          forceList[i].y += force.y;
          forceList[j].x -= force.x;
          forceList[j].y -= force.y;
        }
      }
      const bounds = {minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity};
      let originalX: number[] = [];
      let originalY: number[] = [];
      for (let i = 0; i < forceList.length; i++) {
        originalX.push(layoutList[i].x);
        originalY.push(layoutList[i].y);
        layoutList[i].x += forceList[i].x + SuperRandom.randRange(-0.05,0.05);
        layoutList[i].y += forceList[i].y + SuperRandom.randRange(-0.05,0.05);
        bounds.minX = Math.min(bounds.minX,layoutList[i].x);
        bounds.minY = Math.min(bounds.minY,layoutList[i].y);
        bounds.maxX = Math.max(bounds.maxX,layoutList[i].x);
        bounds.maxY = Math.max(bounds.maxY,layoutList[i].y);
      }
      if (bounds.maxX == -Infinity || bounds.maxY == -Infinity || bounds.minX == Infinity || bounds.minY == Infinity) {
        console.log('inf',bounds,forceList);
        break;
      }
      if (isNaN(bounds.maxX) || isNaN(bounds.maxY) || isNaN(bounds.minX) || isNaN(bounds.minY)) {
        console.log('NaN',bounds,forceList);
        break;
      }
      let totalChange = 0;
      for (let i = 0; i < layoutList.length; i++) {
        layoutList[i].x = (layoutList[i].x - bounds.minX) / (bounds.maxX - bounds.minX);
        layoutList[i].y = (layoutList[i].y - bounds.minY) / (bounds.maxY - bounds.minY);
        totalChange += SuperVector.distance(layoutList[i],{x:originalX[i],y:originalY[i]});
      }
      if (totalChange / layoutList.length < DELTA) {
        break;
      }
    }
    return layoutList;
  }
  public exportAsSVG(): string {
    const layout = this.layout();
    const RADIUS = 25;
    const SIZE = 1000;
    let svg = `<svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `
    <defs>
      <marker id="head" orient="auto" markerWidth="10" markerHeight="5" refX="5" refY="5">
        <path d="M0,0H10L5,5Z" fill="black"/>
      </marker>
    </defs>
    `;
    const scale = (x: number) => x * (SIZE - 2 * RADIUS) + RADIUS;
    for (const edge of this.getEdges()) {
      const start = layout.filter(e => e.node == edge[0])[0];
      const end = layout.filter(e => e.node == edge[1])[0];
      const theta = Math.atan2(start.y-end.y,start.x-end.x);
      svg += `<path marker-end="url(#head)" stroke="black" stroke-width="2" d="M${(scale(start.x)-RADIUS*Math.cos(theta)).toFixed()},${(scale(start.y)-RADIUS*Math.sin(theta)).toFixed()}L${scale(end.x).toFixed()},${scale(end.y).toFixed()}Z"></path>`;
    }
    for (const val of layout) {
      svg += `<circle fill="#123456" cx="${scale(val.x).toFixed()}" cy="${scale(val.y).toFixed()}" r="${RADIUS}"></circle>`;
      svg += `<text fill="white" text-anchor="middle" alignment-baseline="middle" font-family="monospace" font-size="20" x="${scale(val.x).toFixed()}" y="${(scale(val.y)+5).toFixed()}">${val.node}</text>`;
    }
    svg += '</svg>';
    return svg;
  }
  public exportAsSVGDocument(): Document {
    return new DOMParser().parseFromString(this.exportAsSVG(),'image/svg+xml');
  }
}
class BiGraph<T> extends DiGraph<T> {
  public addEdge(start: T,end: T,weight: number = 1): void {
    if (weight < 0) {
      console.error(`Negative weight in bidirectional graph from ${start} to ${end}`);
      return;
    }
    super.addEdge(start,end,weight);
    super.addEdge(end,start,weight);
  }
  public deleteEdge(start: T,end: T): void {
    super.deleteEdge(start,end);
    super.deleteEdge(end,start);
  }

  public getAntiNeighbors(vertex: T): T[] | undefined {
    const neighbors = super.getNeighbors(vertex);
    if (neighbors == undefined) {
      return neighbors;
    }
    return Array.from(neighbors);
  }

  get smallestWeight(): number { return 0; }
  get emptyClone(): BiGraph<T> { return new BiGraph(); }

  public traverse(anchor: T): Map<T,INodePath<T>> {
    return super.traverse(anchor)!;
  }
}
class OrderedQueue<T extends {index:number}> implements Iterable<T> {
  private readonly queue: T[] = [];

  *[Symbol.iterator]() {
    for (const v of this.queue) {
      yield v;
    }
  }

  public clone(): OrderedQueue<T> {
    const clone = new OrderedQueue<T>();
    for (const Q of this.queue) {
      clone.queue.push(Q);
    }
    return clone;
  }

  public enqueue(elem: T,allowDuplicates: boolean = false): void {
    if (this.queue.length == 0) {
      this.queue.push(elem);
    } else if (elem.index < this.queue[0].index) {
      this.queue.unshift(elem);
    } else if (elem.index > this.queue[this.queue.length-1].index) {
      this.queue.push(elem);
    } else {
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue[i].index == elem.index) {
          if (allowDuplicates) {
            this.queue.splice(i,0,elem);
          }
          break;
        }
        if (elem.index > this.queue[i].index && elem.index < this.queue[i+1].index) {
          this.queue.splice(i+1,0,elem);
          break;
        }
      }
    }
  }
  public dequeue(): T | undefined {
    return this.queue.shift();
  }

  public peekAt(index: number): T | undefined {
    return this.queue[index];
  }
  get peekFirst(): T | undefined { return this.queue[0]; }
  get peekLast(): T | undefined { return this.queue[this.queue.length-1]; }

  get size(): number { return this.queue.length; }
  get isEmpty(): boolean { return this.queue.length == 0; }

  public getIndexes(): number[] {
    return this.queue.map(e => e.index);
  }
  public removeWithIndex(index: number | {index:number}): void {
    const numericalIndex = typeof index=='number' ? index : index.index;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].index == numericalIndex) {
        this.queue.splice(i,1);
      }
    }
  }
  public slice(start: T,end: T): T[] {
    const startIndex = this.queue.findIndex(e => e.index == start.index);
    if (startIndex == -1) {
      return [];
    }
    const endIndex = this.queue.findLastIndex(e => e.index == end.index);
    if (endIndex == -1) {
      return this.queue.slice();
    }
    return this.queue.slice(startIndex,endIndex+1);
  }
  public update(): void {
    this.queue.sort((a,b) => a.index - b.index);
  }
}
interface IMapLike<K,V> {
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K,value: V): void;
  delete(key: K): void;
}
class PriorityMap<K,V> implements IMapLike<K,V> {
  private readonly priority: Map<K,V>;
  private readonly fallback: Map<K,V>;

  public constructor(priority: Map<K,V>,fallback: Map<K,V>) {
    this.priority = priority;
    this.fallback = fallback;
  }

  public get(key: K): V | undefined {
    if (this.priority.has(key)) {
      return this.priority.get(key);
    }
    return this.fallback.get(key);
  }
  public has(key: K): boolean {
    return this.priority.has(key) || this.fallback.has(key);
  }

  public set(key: K,value: V): void {
    this.priority.set(key,value);
  }
  public delete(key: K): void {
    this.priority.delete(key);
  }
}
class StorageFileWrapper {
  public static getCookie(cname: string): string {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
  public static setCookie(cname: string,cvalue: string,exdays?: number): void {
    let expires  = '';
    if (exdays != undefined) {
      const d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      expires = "expires="+ d.toUTCString();
    }
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  public static deleteCookie(cname: string): void {
    document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

// ~ INTERFACES ~

interface IMenuDivider {
  text: string
}
interface IMenuOption {
  title: string;
  onclick: (ev: MouseEvent,btn: HTMLButtonElement) => void;
  icon?: string | SVGElement;
  disabled?: boolean;
}
interface IResolutionResult {
  list: AbstractSymbol[],
  error?: CompilationError
}
interface IVectorRange {
  from?: number;
  to?: number;
  until?: number;
  step?: number;
  include?: number[];
  except?: number[];
  exindex?: number[];
  prepend?: number[];
  append?: number[];
}
interface ILineMessage {
  error?: CompilationError,
  warning?: CompilationWarning[],
  recommendations?: CompilationRecommendation[],
}
interface IReplaceEnd {
  readonly match: string;
  readonly substitute: string;
}
interface IStorableConstraint {
  readonly lhs: Alias;
  readonly rhs: Alias;
  readonly cmp: Equality<'<'|'<='|'='|'>'|'>='>;
  readonly line: CodeLine;
  readonly name?: string;
}
interface IQUINNDOVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly isCanary: boolean;
}
interface IQUINNDOFile {
  version: IQUINNDOVersion;
  fileName: string;
  suppress: {
    warnings: boolean;
    recommendations: boolean;
  };
  lines: {
    text: string;
    lineNumber: number;
  }[];
}
enum EVersionComparison {
  MoreStable = 4,
  MajorNewer = 3,
  MinorNewer = 2,
  PatchNewer = 1,
  Same = 0,
  PatchOlder = -1,
  MinorOlder = -2,
  MajorOlder = -3,
  LessStable = -4,
}

// ~ INTERPRETER ~

class Interpreter {
  private static readonly version: IQUINNDOVersion = {
    major: 0,
    minor: 0,
    patch: 1,
    isCanary: true
  };

  private static readonly maxDelayCount = 10;
  private static readonly propgateDelayInMS = 200;

  private static readonly tabs = new Set<Interpreter>();
  private static autocompleteTable?: HTMLTableElement;

  public static readonly messageIconPaths: Readonly<Record<MessageType,string>> = {
    error: 'M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27',
    warning: 'M1 3H23L12 22',
    recommendation: 'M3,3V21H21V3',
    infeasible: ''
  };

  private static readonly nonActionableKeys: ReadonlyArray<string> = [
    'Home','End','Alt','Insert','Delete','OS','Meta','Escape','PageUp','PageDown','CapsLock',
    'MediaPlayPause','AudioVolumeDown','AudioVolumeUp','AudioVolumeMute',
    'ArrowUp','ArrowRight','ArrowDown','ArrowLeft',
    'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'
    // 'Shift'
  ];
  private static readonly symbolLookup: Readonly<Record<string,string>> = {
    ';Alpha': 'Α',
    ';alpha': 'α',
    ';Beta': 'Β',
    ';beta': 'β',
    ';Gamma': 'Γ',
    ';gamma': 'γ',
    ';Delta': 'Δ',
    ';delta': 'δ',
    ';Epsilon': 'Ε',
    ';epsilon': 'ε',
    ';Zeta': 'Ζ',
    ';zeta': 'ζ',
    ';Eta': 'Η',
    ';eta': 'η',
    ';Theta': 'Θ',
    ';theta': 'θ',
    ';Iota': 'Ι',
    ';iota': 'ι',
    ';Kappa': 'Κ',
    ';kappa': 'κ',
    ';Lambda': 'Λ',
    ';lambda': 'λ',
    ';Mu': 'Μ',
    ';mu': 'μ',
    ';Nu': 'Ν',
    ';nu': 'ν',
    ';Xi': 'Ξ',
    ';xi': 'ξ',
    ';Omicron': 'Ο',
    ';omicron': 'ο',
    ';Pi': 'Π',
    ';pi': 'π',
    ';Rho': 'Ρ',
    ';rho': 'ρ',
    ';Sigma': 'Σ',
    ';sigma': 'σ',
    ';Tau': 'Τ',
    ';tau': 'τ',
    ';Upsilon': 'Υ',
    ';upsilon': 'υ',
    ';Phi': 'Φ',
    ';phi': 'φ',
    ';Chi': 'Χ',
    ';chi': 'χ',
    ';Psi': 'Ψ',
    ';psi': 'ψ',
    ';Omega': 'Ω',
    ';omega': 'ω',
    ';deg': '°'
  };
  
  private static readonly ambiguous: ReadonlyArray<StorableSymbolType> = [
    'date','ntwk','node','edge','meas','nmtx','vmtx','offset','model','plot',
  ];
  private static readonly groupings: ReadonlyArray<string> = [
    '(',')','{','}','[',']',
  ];
  private static readonly operators: ReadonlyArray<string> = [
    '^','!',
    '*','%','mod','/',
    '+','-',
    ',',
    // '.',
    ':','?',
    "'",
    '=','<','>','<=','>=',
    'addeach','subeach','multeach','diveach',
    '&','|','xor','nor',
    '~','==','~=','===','~==',
  ];
  private static readonly functions: ReadonlyArray<string> = [
    'range','size','sort',
    'trace','deter',
    'join','split',
    'lsr','rsq',
    'identity','inv','diag',
    'sink','source',
    ...Object.keys(Summarizer.descriptions),
    ...Object.keys(MathOperation.descriptions),
    ...Object.keys(Normalizer.descriptions),
    ...Object.keys(MatrixSize.descriptions),
    //stats
    'ztest','ttest','pztest','pttest','ztest2','ttest2','propztest','propztest2',
    'goftest','indtest','ftest','anova',
    'convert',
    'unique','union',
  ];
  private static readonly domains: ReadonlyArray<string> = [
    'int','bin','urs',
  ];
  private static readonly declarations: ReadonlyArray<StorableSymbolType> = [
    'num','nvec',
    'var','vvec',
    'alias','avec',
    'str','svec',
    'bool','bvec',
    'any','list',
    'test',
    'mvec','dvec','ovec',
    'frame',
  ];
  private static readonly predicates: ReadonlyArray<string> = [
    'is','can',
  ];
  private static readonly keywords: ReadonlyArray<string> = [ //mirrored w/ allowed readonly array in vector constructor
    'step','except','include','exindex','append','prepend',
    'for','to','until','in',
    'true','false',
    'result','val',
    'assert','fa','fo',
    'keyof',
    'import',
  ];
  private static readonly macros: ReadonlyArray<string> = [
    'min_path','maximize','minimize','lindoize','render','print',
  ];
  private static readonly bannedSymbolNames: ReadonlySet<string> = new Set(['e','E']);

  private open: boolean = true;
  private name: string;
  private readonly lineList: CodeLine[] = [];
  private readonly messageMap = new Map<CodeLine,ILineMessage>();

  private readonly tab: HTMLElement;
  private readonly editor: HTMLElement;
  private readonly output: HTMLElement;
  private readonly controlRow: HTMLElement;

  // private opimizerLine: CodeLine | undefined;
  // private optimizingAlias: Alias | undefined;
  // private optimizingMode: 'min' | 'max' | undefined;
  // private readonly constraintSet = new Set<IStorableConstraint>();

  private suppressWarnings: boolean = false;
  private suppressRecommendations: boolean = false;

  private delayCount: number = 0;
  private propogateTimeout: number = 0;
  private lastTypedLine?: CodeLine;
  private lastKeyStroke?: {line:CodeLine,ev:KeyboardEvent};
  private readonly actionBuffer: {ev?:KeyboardEvent,line:CodeLine}[] = [];

  private isPropagating: boolean = false;
  private isRebuilding: boolean = false;
  private isRunning: boolean = false;
  private isImporting: boolean = false;

  private static readonly importedSymbolMap = new Map<string,AbstractStorable>();
  private readonly importLocationMap = new Map<string,CodeLine>();
  private readonly symbolMap = new Map<string,AbstractStorable>([
    ['math',new NumberVector(-1,CodeLine.Unlinked(),[
      new NumberValue(-1,CodeLine.Unlinked(),Math.PI,''),
      new NumberValue(-1,CodeLine.Unlinked(),Math.E,''),
      new NumberValue(-1,CodeLine.Unlinked(),Math.SQRT2,''),
      new NumberValue(-1,CodeLine.Unlinked(),Math.sqrt(3),''),
      new NumberValue(-1,CodeLine.Unlinked(),Math.SQRT1_2,''),
      new NumberValue(-1,CodeLine.Unlinked(),(1+Math.sqrt(5))/2,''),
      new NumberValue(-1,CodeLine.Unlinked(),Infinity,''),
    ],'math',undefined,undefined,['pi','e','sqrt2','sqrt3','sqrt1_2','phi','inf'])],
    ['months',new NumberVector(-1,CodeLine.Unlinked(),[
      new NumberValue(-1,CodeLine.Unlinked(),1,''),
      new NumberValue(-1,CodeLine.Unlinked(),2,''),
      new NumberValue(-1,CodeLine.Unlinked(),3,''),
      new NumberValue(-1,CodeLine.Unlinked(),4,''),
      new NumberValue(-1,CodeLine.Unlinked(),5,''),
      new NumberValue(-1,CodeLine.Unlinked(),6,''),
      new NumberValue(-1,CodeLine.Unlinked(),7,''),
      new NumberValue(-1,CodeLine.Unlinked(),8,''),
      new NumberValue(-1,CodeLine.Unlinked(),9,''),
      new NumberValue(-1,CodeLine.Unlinked(),10,''),
      new NumberValue(-1,CodeLine.Unlinked(),11,''),
      new NumberValue(-1,CodeLine.Unlinked(),12,''),
    ],'months',undefined,undefined,['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'])],
    ['days',new NumberVector(-1,CodeLine.Unlinked(),[
      new NumberValue(-1,CodeLine.Unlinked(),1,''),
      new NumberValue(-1,CodeLine.Unlinked(),2,''),
      new NumberValue(-1,CodeLine.Unlinked(),3,''),
      new NumberValue(-1,CodeLine.Unlinked(),4,''),
      new NumberValue(-1,CodeLine.Unlinked(),5,''),
      new NumberValue(-1,CodeLine.Unlinked(),6,''),
      new NumberValue(-1,CodeLine.Unlinked(),7,''),
    ],'days',undefined,undefined,['mon','tue','wed','thu','fri','sat','sun'])],
    ['today',new NumberVector(-1,CodeLine.Unlinked(),[
      new NumberValue(-1,CodeLine.Unlinked(),new Date().getFullYear(),''),
      new NumberValue(-1,CodeLine.Unlinked(),new Date().getMonth()+1,''),
      new NumberValue(-1,CodeLine.Unlinked(),SuperDate.getISOWeek(new Date()),''),
      new NumberValue(-1,CodeLine.Unlinked(),new Date().getDay()==0?7:new Date().getDay(),''),
      new NumberValue(-1,CodeLine.Unlinked(),new Date().getDate(),''),
      new NumberValue(-1,CodeLine.Unlinked(),SuperDate.daysLeftInYear(new Date()),''),
      new NumberValue(-1,CodeLine.Unlinked(),SuperDate.daysLeftInMonth(new Date()),''),
    ],'today',undefined,undefined,['year','month','week','dow','date','left_in_year','left_in_month'])],
  ]);
  private readonly symbolGraph = new DiGraph<string>();
  private readonly assertionMap = new Map<CodeLine,string[]>();

  private constructor(name: string,tabBtn: HTMLElement,editor: HTMLElement,output: HTMLElement,controls: HTMLElement) {
    this.name = name;
    this.tab = tabBtn;
    this.editor = editor;
    this.output = output;
    this.controlRow = controls;
  }

  public static Init(): void {
    if (Interpreter.version.isCanary && StorageFileWrapper.getCookie('quinndo-canary').length == 0) {
      Interpreter.Welcome();
    } else if (!Interpreter.version.isCanary && StorageFileWrapper.getCookie('quinndo-release').length == 0) {
      Interpreter.Welcome();
    }

    //new button
    document.getElementById('new-tab-btn')!.onclick = () => Interpreter.New();
    window.onclick = () => {
      Interpreter.autocompleteTable?.remove();
      Interpreter.autocompleteTable = undefined;
    }

    //onkeydown
    window.onkeydown = (ev: KeyboardEvent) => { //f8,f9
      const runner = Interpreter.GetOpen();
      if (ev.code == 'F2' && runner) {
        ev.preventDefault();
        runner.renameFile();
      } else if (ev.code == 'F8' && runner) {
        ev.preventDefault();
        runner.run();
      } else if (ev.code == 'F9' && runner) {
        ev.preventDefault();
        runner.downloadAsQuinndo();
      }
    }

    //onpaste
    window.onpaste = (ev: ClipboardEvent) => {
      const runner = Interpreter.GetOpen();
      if (runner && ev.target instanceof Element && ev.target.classList.contains('code-line')) {
        runner.onPaste(ev,ev.target);
        ev.preventDefault();
      }
    }

    //quinndo button
    const quinndoBtn = document.getElementById('quinndo') as HTMLButtonElement;
    quinndoBtn.onmouseenter = () => Interpreter.showMenu(quinndoBtn,[
      {
        title: 'Import QUINNDO File',
        icon: 'M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z',
        onclick: () => { Interpreter.Load(); }
      },
      {
        title: 'Documentation',
        icon: 'M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M6.12,15.5L9.86,19.24L11.28,17.83L8.95,15.5L11.28,13.17L9.86,11.76L6.12,15.5M17.28,15.5L13.54,11.76L12.12,13.17L14.45,15.5L12.12,17.83L13.54,19.24L17.28,15.5Z',
        onclick: () => { window.open('docs.html','_blank'); }
      },
      {
        title: 'Report Bug',
        icon: 'M14,12H10V10H14M14,16H10V14H14M20,8H17.19C16.74,7.22 16.12,6.55 15.37,6.04L17,4.41L15.59,3L13.42,5.17C12.96,5.06 12.5,5 12,5C11.5,5 11.04,5.06 10.59,5.17L8.41,3L7,4.41L8.62,6.04C7.88,6.55 7.26,7.22 6.81,8H4V10H6.09C6.04,10.33 6,10.66 6,11V12H4V14H6V15C6,15.34 6.04,15.67 6.09,16H4V18H6.81C7.85,19.79 9.78,21 12,21C14.22,21 16.15,19.79 17.19,18H20V16H17.91C17.96,15.67 18,15.34 18,15V14H20V12H18V11C18,10.66 17.96,10.33 17.91,10H20V8Z',
        onclick: () => { document.getElementById('bug-report')?.classList.add('visible'); }
      },
      {text:Interpreter.renderVersion(Interpreter.version)}
    ]);

    //unit select
    const unitSelect = document.getElementById('frame-auto-unit-select')!;
    const unitStarts = keys(Measurement.conversionCategories);
    const unitNames = keys(Measurement.conversionTable);
    const optFrag = new DocumentFragment();

    const baseSIGroup = document.createElement('optgroup');
    baseSIGroup.setAttribute('label','Base-ish SI Units');
    for (const unit of Measurement.siUnits) {
      const unitOption = document.createElement('option');
      unitOption.textContent = unit;
      baseSIGroup.appendChild(unitOption);
    }
    optFrag.appendChild(baseSIGroup);

    for (let i = 0; i < unitStarts.length; i++) {
      const unitGroup = document.createElement('optgroup');
      const groupName = Measurement.conversionCategories[unitStarts[i]];
      unitGroup.setAttribute('label',groupName);
      const start = unitNames.indexOf(unitStarts[i]);
      if (start == -1) {
        console.error('wtf',unitStarts[i]);
        continue;
      }
      const end = i==unitStarts.length-1?unitNames.length:unitNames.indexOf(unitStarts[i+1]);
      if (unitStarts[i] == '°R') {
        const cOption = document.createElement('option');
        cOption.textContent = '°C';
        const fOption = document.createElement('option');
        fOption.textContent = '°F';
        unitGroup.appendChild(cOption);
        unitGroup.appendChild(fOption);
      }
      for (let j = start; j < end; j++) {
        if (groupName != 'Velocity' && Measurement.conversionTable[unitNames[j]].alt) {
          continue;
        }
        const unitOption = document.createElement('option');
        unitOption.textContent = unitNames[j];
        unitGroup.appendChild(unitOption);
      }
      optFrag.appendChild(unitGroup);
    }
    unitSelect.appendChild(optFrag);

    //open new tab
    Interpreter.New();
  }
  private static Welcome(): void {
    document.getElementById('welcome-message')!.textContent = 'Welcome to QUINNDO' + (Interpreter.version.isCanary?' Canary Edition':'') + '!';
    const versionName = Interpreter.renderVersion(Interpreter.version);
    document.getElementById('welcome-version')!.textContent = 'You are using ' + versionName;
    document.getElementById('welcome')!.classList.add('visible');
    StorageFileWrapper.setCookie(
      Interpreter.version.isCanary?'quinndo-canary':'quinndo-release',
      versionName
    );
  }
  private static New(fileName?: string): Interpreter {
    //name new tab
    const usedNames = Array.from(Interpreter.tabs).map(e => e.name);
    let proposedName = fileName ?? 'untitled';
    let i = 1;

    while (usedNames.includes(proposedName)) {
      proposedName = 'untitled' + i;
      i++;
    }
  
    //create doms
    const tabCont = document.createElement('div');
    tabCont.classList.add('tab');
    //main btn
    const mainBtn = document.createElement('button');
    mainBtn.classList.add('main','selected');
    tabCont.append(mainBtn);
    const mainSpan = document.createElement('span');
    mainSpan.textContent = proposedName + '.qndo';
    mainBtn.append(mainSpan);
    //close button
    const closeBtn = document.createElement('button');
    closeBtn.title = 'Close Tab';
    closeBtn.classList.add('close');
    tabCont.append(closeBtn);
    const closeIcon = document.createElementNS('http://www.w3.org/2000/svg','svg');
    closeIcon.setAttribute('viewBox','0 0 24 24');
    const closePath = document.createElementNS('http://www.w3.org/2000/svg','path');
    closePath.setAttribute('d','M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z')
    closeIcon.append(closePath);
    closeBtn.append(closeIcon);
    //append
    document.getElementById('tab-bar')!.insertBefore(tabCont,document.getElementById('new-tab-btn'));
  
    //editor
    const editorCont = document.createElement('div');
    editorCont.style.overflow = 'auto';
    editorCont.classList.add('visible','editor');
    document.body.append(editorCont);
    
    //output
    const outputCont = document.createElement('div');
    outputCont.classList.add('visible','output');
    document.body.append(outputCont);

    const controlCont = document.createElement('div');
    controlCont.classList.add('control-cont','visible');

    const runner = new Interpreter(proposedName,tabCont,editorCont,outputCont,controlCont);

    //controls
    for (const div of document.getElementsByClassName('control-cont')) {
      div.classList.remove('visible');
    }
    function createButton(title: string,d: string,fill: string,fxn: (btn: HTMLButtonElement) => any,fxnType: 'click' | 'enter'): void {
      const button = document.createElement('button');
      button.title = title;
      if (fxnType == 'click') {
        button.onclick = () => fxn(button);
      } else {
        button.onmouseenter = () => fxn(button);
      }
      const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.setAttribute('viewBox','0 0 24 24');
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('fill',fill);
      path.setAttribute('d',d);
      icon.append(path);
      button.append(icon);
      controlCont.append(button);
    }
    createButton(
      'Run (F8)',
      'M8,5.14V19.14L19,12.14L8,5.14Z',
      'var(--green)',
      () => runner.run(),
      'click'
    );
    createButton(
      'Download (F9)',
      'M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z',
      'var(--turquoise)',
      () => runner.downloadAsQuinndo(),
      'click'
    );
    createButton(
      'Rebuild',
      'M19.36,2.72L20.78,4.14L15.06,9.85C16.13,11.39 16.28,13.24 15.38,14.44L9.06,8.12C10.26,7.22 12.11,7.37 13.65,8.44L19.36,2.72M5.93,17.57C3.92,15.56 2.69,13.16 2.35,10.92L7.23,8.83L14.67,16.27L12.58,21.15C10.34,20.81 7.94,19.58 5.93,17.57Z',
      'var(--blue)',
      () => runner.rebuild(),
      'click'
    );
    createButton(
      'File Settings',
      'M6 2C4.89 2 4 2.89 4 4V20A2 2 0 0 0 6 22H12.68A7 7 0 0 1 12 19A7 7 0 0 1 19 12A7 7 0 0 1 20 12.08V8L14 2H6M13 3.5L18.5 9H13V3.5M18 14C17.87 14 17.76 14.09 17.74 14.21L17.55 15.53C17.25 15.66 16.96 15.82 16.7 16L15.46 15.5C15.35 15.5 15.22 15.5 15.15 15.63L14.15 17.36C14.09 17.47 14.11 17.6 14.21 17.68L15.27 18.5C15.25 18.67 15.24 18.83 15.24 19C15.24 19.17 15.25 19.33 15.27 19.5L14.21 20.32C14.12 20.4 14.09 20.53 14.15 20.64L15.15 22.37C15.21 22.5 15.34 22.5 15.46 22.5L16.7 22C16.96 22.18 17.24 22.35 17.55 22.47L17.74 23.79C17.76 23.91 17.86 24 18 24H20C20.11 24 20.22 23.91 20.24 23.79L20.43 22.47C20.73 22.34 21 22.18 21.27 22L22.5 22.5C22.63 22.5 22.76 22.5 22.83 22.37L23.83 20.64C23.89 20.53 23.86 20.4 23.77 20.32L22.7 19.5C22.72 19.33 22.74 19.17 22.74 19C22.74 18.83 22.73 18.67 22.7 18.5L23.76 17.68C23.85 17.6 23.88 17.47 23.82 17.36L22.82 15.63C22.76 15.5 22.63 15.5 22.5 15.5L21.27 16C21 15.82 20.73 15.65 20.42 15.53L20.23 14.21C20.22 14.09 20.11 14 20 14H18M19 17.5C19.83 17.5 20.5 18.17 20.5 19C20.5 19.83 19.83 20.5 19 20.5C18.16 20.5 17.5 19.83 17.5 19C17.5 18.17 18.17 17.5 19 17.5Z',
      'var(--purple)',
      (btn: HTMLButtonElement) => Interpreter.showMenu(btn,[
        {text:'Reporting Options'},
        {title:`Suppress Warnings (${runner.suppressWarnings?'On':'Off'})`,onclick:(ev:MouseEvent,btn:HTMLButtonElement) => {
          runner.suppressWarnings = !runner.suppressWarnings;
        }},
        {title:`Suppress Recommendations (${runner.suppressRecommendations?'On':'Off'})`,onclick:(ev:MouseEvent,btn:HTMLButtonElement) => {
          runner.suppressRecommendations = !runner.suppressRecommendations;
        }},
        {text:'Import Data'},
        {title:'Import Data Frame',onclick:() => runner.importFrame()},
      ]),
      'enter'
    );
    document.getElementById('top-bar')!.insertBefore(controlCont,document.getElementById('quinndo'));
    
    mainBtn.onclick = () => {
      Interpreter.autocompleteTable?.remove();
      Interpreter.autocompleteTable = undefined;
      for (const int of Interpreter.tabs.values()) {
        if (int == runner) {
          int.show();
        } else {
          int.hide();
        }
      }
    }
    closeBtn.onclick = () => runner.delete();

    for (const int of Interpreter.tabs.values()) {
      int.hide();
    }
    Interpreter.tabs.add(runner);
    runner.addNewLine();
    return runner;
  }

  public static BugReport(): void {
    const runner = Interpreter.GetOpen();
    if (runner == undefined) { return; }
    // const dateStr = new Date().toISOString().replace('T','-').slice(0,-4).replace(/:/g,'-');
    const date = new Date();
    const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('Z')[0];
    runner.downloadAsQuinndo('bug-report-' + dateStr.slice(0,-4).replace('T',' ').replace(/ /g,'-'));
    window.open('https://forms.gle/wMKzRmTB1CE3x1Pv6','_blank');
  }
  private static Load(): void {
    const fileInput = document.createElement('input');
    const allowedExtensions = ['.qndo'];
    fileInput.type = 'file';
    fileInput.accept = allowedExtensions.join(',');
    fileInput.addEventListener('change',() => {
      const files = fileInput.files;
      if (files == null) {
        return;
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (Interpreter.isValidFileExtension(file.name,allowedExtensions)) {
          Interpreter.LoadCallback(file);
          break;
        }
      }
    });
    fileInput.click();
  }
  private static LoadCallback(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = JSON.parse(reader.result as string) as IQUINNDOFile;
        const htmlList: string[] = content.lines.sort((a,b) => a.lineNumber - b.lineNumber).map(e => e.text);
        const editor = Interpreter.New(content.fileName);
        editor.suppressRecommendations = content.suppress.recommendations;
        editor.suppressWarnings = content.suppress.warnings;
        for (let i = 0; i < htmlList.length; i++) {
          const line = i==0 ? editor.lineList[0] : editor.addNewLine();
          line.html = htmlList[i];
          editor.updateSyntax(line);
        }
        editor.show();
      } catch(e) {}
    }
    reader.readAsText(file);
  }

  private static isStorableSymbol(a: any): a is AbstractStorable {
    return a instanceof StorableSymbol;
  }
  public static inferStorableFromString(value: string,line: CodeLine): AbstractStorable {
    if (value == undefined || value.length == 0) {
      return new NoneType(-1,line,'');
    }
    const number = Number(value.replace(/_/g,''));
    if (!isNaN(number)) {
      return new NumberValue(-1,line,number,'');
    }
    const dateParse = DateStringInator.parse(value);
    if (dateParse) {
      return new DateValue(-1,line,dateParse.date,'',dateParse.specified);
    }
    if (value.toLowerCase() == 'true') {
      return new BooleanValue(-1,line,true,'');
    }
    if (value.toLowerCase() == 'false') {
      return new BooleanValue(-1,line,false,'');
    }
    return new StringValue(-1,line,value,'');
  }
  public static inferTypeFromString(value: string): StorableSymbolType {
    if (value == undefined || value.length == 0) {
      return 'none';
    }
    const number = Number(value.replace(/_/g,''));
    if (!isNaN(number)) {
      return 'num';
    }
    if (DateStringInator.parse(value)) {
      return 'date';
    }
    if (value.toLowerCase() == 'true' || value.toLowerCase() == 'false') {
      return 'bool'
    }
    return 'str';
  }

  private static renderVersion(version: IQUINNDOVersion) {
    return 'Version ' + version.major + '.' + version.minor + '.' + version.patch + (version.isCanary?'-canary':'');
  }
  private static compareVersions(a: IQUINNDOVersion,b: IQUINNDOVersion): EVersionComparison {
    if (a.isCanary == b.isCanary && a.major == b.major && a.minor == b.minor && a.patch == b.patch) {
      return EVersionComparison.Same;
    }
    if (a.isCanary && !b.isCanary) {
      return EVersionComparison.LessStable;
    }
    if (!a.isCanary && b.isCanary) {
      return EVersionComparison.MoreStable;
    }
    if (a.major > b.major) {
      return EVersionComparison.MajorNewer;
    }
    if (a.major < b.major) {
      return EVersionComparison.MajorOlder;
    }
    if (a.minor > b.minor) {
      return EVersionComparison.MinorNewer;
    }
    if (a.minor < b.minor) {
      return EVersionComparison.MinorOlder;
    }
    if (a.patch > b.patch) {
      return EVersionComparison.PatchNewer;
    }
    if (a.patch < b.patch) {
      return EVersionComparison.PatchOlder;
    }
    return EVersionComparison.Same;
  }

  public static messageSymbol(msg: CompilationMessage,pos: MessagePosition): SVGElement {
    return Interpreter.createSVG(
      Interpreter.messageIconPaths[msg.type],
      msg.toString(),
      [msg.type+'-message',pos]
    );
  }
  public static createSVG(path: string,title: string,className?: string | string[]): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    if (className) {
      for (const cls of Array.isArray(className)?className:[className]) {
        svg.classList.add(cls);
      }
    }
    svg.setAttribute('viewBox','0 0 24 24');
    const pathDOM = document.createElementNS('http://www.w3.org/2000/svg','path');
    pathDOM.setAttribute('d',path);
    svg.append(pathDOM);
    const titleDOM = document.createElementNS('http://www.w3.org/2000/svg','title');
    titleDOM.textContent = title;
    svg.append(titleDOM);
    return svg;
  }
  private static showMenu(anchor: HTMLElement,options: (IMenuOption|IMenuDivider)[]): void {
    // if (anchor.getAttribute('data-expanded') == 'true') {
    //   return;
    // }
    // anchor.setAttribute('data-expanded','true');
    for (const elem of document.getElementsByClassName('menu-cont')) {
      elem.remove();
    }
    const menu = document.createElement('div');
    menu.classList.add('menu-cont');
    const splicer = document.createElement('div');
    splicer.classList.add('menu-splicer');
    const right = window.innerWidth - anchor.getBoundingClientRect().right;
    menu.style.right = right + 'px';
    splicer.style.right = right + 'px';
    function closeMenu(): void {
      menu.remove();
      splicer.remove();
      anchor.removeAttribute('data-expanded');
      window.onmousemove = null;
    }
    window.onmousemove = (ev: MouseEvent) => {
      const divs = document.elementsFromPoint(ev.clientX,ev.clientY);
      if (!divs.includes(anchor) && !divs.includes(splicer) && !divs.includes(menu)) {
        closeMenu();
      }
    }
    for (const opt of options) {
      if ('text' in opt) {
        const div = document.createElement('div');
        div.textContent = opt.text;
        menu.appendChild(div);
      } else {
        const btn = document.createElement('button');
        btn.textContent = opt.title;
        if (opt.disabled) {
          btn.classList.add('disabled');
        }
        if (opt.icon) {
          btn.prepend(typeof opt.icon == 'string' ? Interpreter.createSVG(opt.icon,opt.title) : opt.icon);
        }
        btn.onclick = (ev: MouseEvent) => {
          opt.onclick(ev,btn);
          closeMenu();
        }
        menu.appendChild(btn);
      }
    }
    document.body.appendChild(menu);
    document.body.appendChild(splicer);
  }
  private static GetOpen(): Interpreter | undefined {
    for (const runner of Interpreter.tabs) {
      if (runner.open) {
        return runner;
      }
    }
  }

  private static isValidSymbol(val: any,strict: boolean = false): boolean {
    if (typeof val != 'string') {
      return false;
    }
    if (/^[0-9]/.test(val) && strict) {
      return false;
    }
    return /^[a-zA-Z0-9_]*$/.test(val);
  }
  private static escape(str: string): string {
    return str.replace(/ /g,'&nbsp;').replace(/\//g,'&sol;').replace(/\\/g,'&bsol;');
  }
  private static clean(str: string): string {
    return Interpreter.escape(str).replace(
      /&bsol;"/g,
      '<span class="escaped">&bsol;"</span>'
    ).replace(/[α-ωΑ-Ω°]/g,function(match) {
      return `<span class="escaped">${match}</span>`;
    });
  }
  private static deescape(str: string): string {
    return str.replace(/&nbsp;/g,' ').replace(/&sol;/,'/').replace(/&bsol;/,'\\');
  }
  private static download(content: BlobPart,fileName: string,type: 'text/json' | 'text/plain'): void {
    const blob = new Blob([content],{type:type});
    const downloadLink = document.createElement('a');
    downloadLink.style.display = 'none';
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
  private static isValidFileExtension(fileName: string,allowedExtensions: string[]): boolean {
    return allowedExtensions.includes(fileName.slice(fileName.lastIndexOf('.')));
  }

  private hide(): void {
    this.open = false;
    this.editor.classList.remove('visible');
    this.output.classList.remove('visible');
    this.controlRow.classList.remove('visible');
    this.tab.children[0].classList.remove('selected');
  }
  private show(): void {
    this.open = true;
    this.editor.classList.add('visible');
    this.output.classList.add('visible');
    this.controlRow.classList.add('visible');
    this.tab.children[0].classList.add('selected');
  }
  private delete(): void {
    if (Interpreter.tabs.size > 1) {
      this.editor.remove();
      this.output.remove();
      this.controlRow.remove();
      this.tab.remove();
      Interpreter.tabs.delete(this);
      if (this.open) {
        for (const int of Interpreter.tabs.values()) {
          int.show();
          break;
        }
      }
    }
  }

  private addNewLine(insertBefore?: CodeLine): CodeLine {
    const lineIndex = insertBefore?.index ?? this.lineList.length;
    const line = new CodeLine(this.editor,lineIndex,insertBefore);
    line.onkeydown = ev => this.onKeyDown(ev,line);
    line.focus();
    this.lineList.splice(insertBefore?.index ?? this.lineList.length,0,line);
    Interpreter.autocompleteTable?.remove();
    Interpreter.autocompleteTable = undefined;
    this.updateLineNumbers();

    // const output = new OutputLine(line);
    // output.outputText('Hello world!','warning');
    // output.outputDocument(new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect height="100" width="100" fill="blue"></rect></svg>','image/svg+xml'));
    // output.outputText('Hello world!','warning');
    // output.appendTo(this.output);

    return line;
  }
  private onKeyDown(ev: KeyboardEvent,line: CodeLine): void {
    if (ev.repeat || this.isRebuilding || this.isRunning || this.isImporting) {
      return;
    }
    if (!ev.ctrlKey && !ev.altKey) {
      ev.preventDefault();
    }
    let actionDone = false;
    let hideAutoCompleteTable = true;
    if (ev.key == 'Enter') { //new line
      ev.preventDefault();
      actionDone = true;
      if (Interpreter.autocompleteTable) {
        this.replaceSyntax(Interpreter.autocompleteTable.querySelector('.selected'));
      } else {
        const caretPos = line.caretPosition;
        const newLine = this.addNewLine(this.lineList[line.index+1]);
        const initText = line.text;
        let moveAfterText = true;
        if (caretPos.start == caretPos.end) {
          moveAfterText = false;
          for (let i = caretPos.start; i < initText.length; i++) {
            if (initText[i] == '#') {
              break;
            }
            if (initText[i] != '"' && initText[i] != ')' && initText[i] != ']' && initText[i] != ' ' && initText[i] != '\u00a0') {
              moveAfterText = true;
              break;
            }
          }
        }
        if (moveAfterText) {
          line.text = initText.slice(0,caretPos.start);
          newLine.text = initText.slice(caretPos.end);
        }
        newLine.caretPosition = {start:0,end:0};
        this.updateSyntax(line);
        this.updateSyntax(newLine);
        this.updateLineNumbers();
      }
    } else if (ev.key == 'Tab') {
      if (Interpreter.autocompleteTable) {
        this.replaceSyntax(Interpreter.autocompleteTable.querySelector('.selected'));
        actionDone = true;
      }
    } else if (ev.key == 'Backspace' && line.caretPosition.end == 0 && this.editor.children.length > 1) { //remove line
      ev.preventDefault();
      actionDone = true;
      if (line.index > 0) {
        const prevLine = this.lineList[line.index - 1];
        prevLine.text = prevLine.text + line.text;
        const length = prevLine.text.length;
        this.deleteLineAtIndex(line.index);
        prevLine.caretPosition = {start:length,end:length};
        this.updateSyntax(prevLine);
      }
    } else if (ev.altKey && ev.shiftKey && (ev.key == 'ArrowUp' || ev.key == 'ArrowDown')) { //duplicate
      const pos = line.caretPosition;
      console.log('pos',pos);
      ev.preventDefault();
      actionDone = true;

      const insertPosition = ev.key=='ArrowUp'&&line.index>0?line.index:line.index+1;
      const insertBefore = ev.key=='ArrowUp'&&line.index>0?line:this.lineList[line.index+1];
      const cloneLine = line.clone(this.editor,insertPosition,insertBefore);
      cloneLine.onkeydown = ev => this.onKeyDown(ev,cloneLine);
      this.lineList.splice(insertPosition,0,cloneLine);
      cloneLine.blur();
      line.focus();
      line.caretPosition = pos;
      this.updateLineNumbers();
      this.updateSyntax(line);
      this.updateSyntax(cloneLine);
    } else if (ev.altKey && (ev.key == 'ArrowUp' || ev.key == 'ArrowDown')) { //swap lines
      const pos = line.caretPosition;
      ev.preventDefault();
      actionDone = true;
      if (ev.key == 'ArrowUp' && line.index > 0) { //move up
        line.moveAbove(this.editor,this.lineList[line.index - 1]);
        this.lineList[line.index] = this.lineList[line.index - 1];
        this.lineList[line.index - 1] = line;
      } else if (ev.key == 'ArrowDown' && line.index < this.lineList.length - 1) { //move down
        line.moveBelow(this.editor,this.lineList[line.index + 1]);
        this.lineList[line.index] = this.lineList[line.index + 1];
        this.lineList[line.index + 1] = line;
      }
      line.focus();
      line.caretPosition = pos;
      this.updateLineNumbers();
      this.updateSyntax(line);
    } else if (ev.key == 'ArrowUp') { //go to line above
      ev.preventDefault();
      actionDone = true;
      if (Interpreter.autocompleteTable) {
        hideAutoCompleteTable = false;
        const highlightedRow = Interpreter.autocompleteTable.querySelector('.selected');
        highlightedRow?.classList.remove('selected');
        if (highlightedRow?.previousElementSibling) {
          highlightedRow.previousElementSibling.classList.add('selected');
        } else {
          const lastChild = highlightedRow?.parentElement?.lastElementChild;
          if (lastChild?.hasAttribute('data-substitute')) {
            lastChild?.classList.add('selected');
          } else {
            lastChild?.previousElementSibling?.classList.add('selected');
          }
          // highlightedRow?.parentElement?.lastElementChild?.classList.add('selected');
        }
      } else {
        const pos = line.caretPosition;
        if (line.index > 0) {
          const prevLine = this.lineList[line.index - 1];
          line.blur();
          prevLine.focus();
          if (pos.start <= prevLine.text.length) {
            prevLine.caretPosition = {start:pos.start,end:pos.start};
          } else {
            prevLine.caretPosition = {start:prevLine.text.length,end:prevLine.text.length};
          }
        }
      }
    } else if (ev.key == 'ArrowDown') { //go to line below
      ev.preventDefault();
      actionDone = true;
      if (Interpreter.autocompleteTable) {
        hideAutoCompleteTable = false;
        const highlightedRow = Interpreter.autocompleteTable.querySelector('.selected');
        highlightedRow?.classList.remove('selected');
        if (highlightedRow?.nextElementSibling && highlightedRow.nextElementSibling.hasAttribute('data-substitute')) {
          highlightedRow?.nextElementSibling.classList.add('selected');
        } else {
          highlightedRow?.parentElement?.firstElementChild?.classList.add('selected');
        }
      } else {
        if (line.index < this.lineList.length - 1) {
          const pos = line.caretPosition;
          const nextLine = this.lineList[line.index + 1];
          line.blur();
          nextLine.focus();
          if (pos.end <= nextLine.text.length) {
            nextLine.caretPosition = {start:pos.end,end:pos.end};
          } else {
            nextLine.caretPosition = {start:nextLine.text.length,end:nextLine.text.length};
          }
        }
      }
    } else if (ev.key == 'ArrowLeft') { //move cursor left
      actionDone = true;
      const position = line.caretPosition;
      if (position.start == position.end) {
        if (position.start > 0) { //move back on line
          line.caretPosition = {start:position.start-1,end:position.end-1};
        } else if (line.index > 0) { //move to end of previous line
          const prevLine = this.lineList[line.index - 1];
          prevLine.caretPosition = {start:prevLine.text.length,end:prevLine.text.length};
        }
      } else {
        line.caretPosition = {start:position.start,end:position.start};
      }
    } else if (ev.key == 'ArrowRight') { //move cursor right
      actionDone = true;
      const position = line.caretPosition;
      if (position.start == position.end) {
        if (position.start < line.text.length) { //move back on line
          line.caretPosition = {start:position.start+1,end:position.end+1};
        } else if (line.index < this.lineList.length - 1) { //move to end of previous line
          const nextLine = this.lineList[line.index + 1];
          nextLine.caretPosition = {start:0,end:0};
        }
      } else {
        line.caretPosition = {start:position.end,end:position.end};
      }
    } else if (ev.key == 'Home') { //move to start
      if (ev.ctrlKey) {
        ev.preventDefault();
        this.lineList[0].caretPosition = {start:0,end:0};
      } else if (ev.shiftKey) {
        const pos = line.caretPosition;
        line.caretPosition = {start:0,end:pos.end};
      } else {
        line.caretPosition = {start:0,end:0};
      }
    } else if (ev.key == 'End') { //move to end
      if (ev.ctrlKey) {
        ev.preventDefault();
        const finalLine = this.lineList[this.lineList.length - 1];
        finalLine.caretPosition = {start:finalLine.text.length,end:finalLine.text.length};
      } else if (ev.shiftKey) {
        const pos = line.caretPosition;
        line.caretPosition = {start:pos.start,end:line.text.length};
      } else {
        line.caretPosition = {start:line.text.length,end:line.text.length};
      }
    } else if (ev.key == '/' && ev.ctrlKey) { //comment line
      actionDone = true;
      const downstreamLines = new OrderedQueue<CodeLine>();
      if (line.text.charAt(0) == '#') { //commenting line
        line.text = line.text.substring(1);
      } else {
        for (const sym of this.getSymbolsDeclaredOnLine(line)) {
          for (const neighbor of this.symbolGraph.getNeighbors(sym.name!) ?? []) {
            downstreamLines.enqueue(this.symbolMap.get(neighbor)!.line);
          }
        }
        line.text = '#' + line.text;
      }
      this.updateSyntax(line);
      for (const downstream of downstreamLines) {
        this.actionBuffer.push({line:downstream});
      }
      this.propagateChanges(line);
    }
    if (hideAutoCompleteTable) {
      Interpreter.autocompleteTable?.remove();
      Interpreter.autocompleteTable = undefined;
    }
    const actionable = !Interpreter.nonActionableKeys.includes(ev.key) && !ev.ctrlKey && !ev.altKey;
    if (!actionDone && actionable) {
      this.updateSyntax(line,ev);
    }
  }
  private onPaste(ev: ClipboardEvent,target: Element): void {
    const text = ev.clipboardData?.getData('text');
    if (text == undefined) {
      return;
    }
    let codeLine: CodeLine | undefined;
    for (const line of this.lineList) {
      if (line.matches(target)) {
        codeLine = line;
        break;
      }
    }
    if (codeLine == undefined) {
      return;
    }
    const lineList: string[] = text.split('\u000a').map(e => e.replace(/ /g,'\u00a0'));
    if (lineList.length == 0) {
      return;
    }

    let insertBefore = codeLine;
    codeLine.text = codeLine.text + lineList[0];
    this.updateSyntax(codeLine);

    for (let i = 1; i < lineList.length; i++) {
      const addedLine = this.addNewLine(this.lineList[insertBefore.index+1]);
      addedLine.text = lineList[i];
      this.updateSyntax(addedLine);
      insertBefore = addedLine;
    }

    insertBefore.caretPosition = {start:insertBefore.text.length,end:insertBefore.text.length};
  }
  private deleteLineAtIndex(index: number): void {
    if (index < 0 || index >= this.lineList.length || this.lineList.length == 1) {
      return;
    }
    this.lineList[index].remove();
    if (this.lineList[index-1]) {
      this.lineList[index-1].focus();
    } else {
      this.lineList[index+1].focus();
    }
    this.lineList.splice(index,1);
    this.updateLineNumbers();
  }
  private updateLineNumbers(): void {
    for (let i = 0; i < this.lineList.length; i++) {
      this.lineList[i].index = i;
    }
  }

  private parseSyntax(commandList: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[],focusLine: CodeLine,output: OutputLine | undefined): CompilationError | undefined {
    if (commandList.length == 0) {
      return;
    }
    let groupingLevel = 0;
    for (let i = 0; i < commandList.length; i++) { //preprocessing
      if (commandList[i] instanceof GroupingSymbol) {
        if ((commandList[i] as AbstractGroupingSymbol).opening) {
          groupingLevel++;
        } else {
          groupingLevel--;
        }
      }
      //insert multiplication signs
      if (i < commandList.length - 1 && commandList[i].type == 'num' && commandList[i].name == undefined && (commandList[i+1].type == 'num' || commandList[i+1].type == 'var' || commandList[i+1].type == 'alias' || commandList[i+1].type == 'nvec')) {
        const mult = new Multiplication(-1,commandList[0].line,'*');
        mult.priority += (MAX_OPERATOR_PRIORITY + 1) * groupingLevel;
        commandList.splice(i+1,0,mult);
      }
      //replace with booleans
      if (commandList[i].value == 'true' || commandList[i].value == 'false') {
        commandList[i] = new BooleanValue(commandList[i].index,commandList[i].line,commandList[i].value=='true',commandList[i].value as string);
        commandList[i].displayAsKeyword = true;
      }
      //replace with none
      if (commandList[i].value == 'none') {
        commandList[i] = new NoneType(commandList[i].index,commandList[i].line,commandList[i].value as string);
        commandList[i].displayAsKeyword = true;
      }
    }
    if (commandList[0]?.value == 'import') {
      if (commandList.length != 2) {
        return new CompilationError(ErrorName.Import_MissingSingleName,commandList,commandList,'parseSyntax no import name');
      }
      const name = KeyableSymbol.getPropName(commandList[1]);
      const importedSymbol = Interpreter.importedSymbolMap.get(name);
      if (importedSymbol == undefined) {
        return new CompilationError(ErrorName.Import_NonImported,commandList[1],commandList[1],'parseSyntax import not found');
      }
      if (this.importLocationMap.get(name)?.index! < focusLine.index) {
        recList.push(new CompilationRecommendation(RecommendationName.Import_AlreadyImported,commandList[1],commandList[1],'parseSyntax already imported'));
      } else {
        this.importLocationMap.set(name,focusLine);
      }
      // const clonedImport = importedSymbol.clone(-1,commandList[1].text,focusLine);
      commandList[1] = importedSymbol.rename(commandList[1].index,commandList[1].text as string,focusLine);
      
      // clonedImport.consumeEnd(commandList[1]);
      return undefined;
    } else if (commandList[0]?.value == 'assert') {
      const assertion = this.fullyResolve(commandList.slice(1),warnList,recList,false);
      if (assertion.error) {
        return assertion.error;
      }
      if (assertion.list.length != 1) {
        return new CompilationError(ErrorName.Assertion_NonResolvable,commandList.slice(1),commandList.slice(1),'fullyResolve assertion nonresolve');
      }
      if (!(assertion.list[0] instanceof StorableSymbol) || !assertion.list[0].castableTo('bool')) {
        return new CompilationError(ErrorName.Assertion_NonBoolean,assertion.list[0],assertion.list[0],'fullyResolve assertion nonbool');
      }
      if (assertion.list[0].castTo('bool').value == false) {
        return new CompilationError(ErrorName.Assertion_Failed,commandList[0],commandList[0],'fullyResolve assertion failed');;
      }
      return undefined;
    } else if (commandList[0]?.type == 'declaration') {
      return this.parseDeclaration(commandList,warnList,recList,focusLine);
    } else if (commandList[0] instanceof AppendableValue && commandList[1] instanceof Append) {
      if (commandList.length == 2) {
        return new CompilationError(ErrorName.Appendable_MissingValue,commandList,commandList,'missing appending value');
      }
      if (commandList[0].getFreezeStatus(focusLine)) {
        return new CompilationError(ErrorName.Appendable_Frozen,commandList[0],commandList[0],'parseSyntax frozen');
      }
      const appendingValues: AbstractStorable[] = [];
      if (commandList[0].castableTo('model')) {
        const bounds = this.boundResolve(commandList.slice(2),warnList,recList);
        if (bounds instanceof CompilationError) {
          return bounds;
        }
        appendingValues.push(...bounds);
        for (let i = 0; i < bounds.length; i++) {
          console.log('BOUND',i,bounds[i].boundize);
        }
      } else {
        let groupingLevel = 0;
        const appendingMatrix: AbstractSymbol[][] = [[]];
        for (let i = 2; i < commandList.length; i++) {
          if (commandList[i] instanceof GroupingSymbol) {
            if ((commandList[i] as AbstractGroupingSymbol).opening) {
              groupingLevel++;
            } else {
              groupingLevel--;
            }
          }
          if (groupingLevel == 0 && commandList[i].value == ',') {
            appendingMatrix.push([]);
          } else {
            appendingMatrix[appendingMatrix.length-1].push(commandList[i]);
          }
        }
        for (const matrixRow of appendingMatrix) {
          if (matrixRow.length == 1) {
            if (matrixRow[0] instanceof StorableSymbol) {
              appendingValues.push(matrixRow[0]);
              continue;
            } else {
              return new CompilationError(ErrorName.Appendable_WrongType,[matrixRow[0],commandList[0]],[matrixRow[0],commandList[0]],'singleResolve append wrong type');
            }
          }
          if (matrixRow.length == 0) {
            warnList.push(new CompilationWarning(WarningName.Append_MissingAppendingValue,commandList.slice(2),commandList.slice(2),'parseSyntax missing slot'));
            continue;
          }
          const iterValue = this.fullyResolve(matrixRow,warnList,recList,false);
          if (iterValue.error) {
            return iterValue.error;
          }
          if (iterValue.list.length != 1) {
            return new CompilationError(ErrorName.Appendable_NonResolving,matrixRow,matrixRow,'parseSyntax append non-resolve');
          }
          const appendValue = iterValue.list[0];
          if (!(appendValue instanceof StorableSymbol) || !commandList[0].isAppendableType(appendValue)) {
            return new CompilationError(ErrorName.Appendable_WrongType,[appendValue,commandList[0]],[appendValue,commandList[0]],'singleResolve append wrong type');
          }
          appendingValues.push(appendValue);
        }
      }
      if (appendingValues.length == 0) {
        return new CompilationError(ErrorName.Appendable_MissingValue,commandList,commandList,'missing appending value');
      }
      const appendingValue = this.symbolMap.get(commandList[0].name!);
      if (appendingValue == undefined || !(appendingValue instanceof AppendableValue)) {
        return new CompilationError(ErrorName.IllegalExpression,commandList[0],commandList[0],'parseSyntax appending missing');
      }
      for (const value of appendingValues) {
        // const appendResult = commandList[0].append(value,focusLine);
        const appendResult = appendingValue.append(value,focusLine);
        if (appendResult instanceof CompilationError) {
          // commandList[0].removeValuesFromLine(focusLine);
          appendingValue.removeValuesFromLine(focusLine);
          return appendResult;
        }
        if (appendResult instanceof CompilationWarning) {
          warnList.push(appendResult);
        }
      }
      return undefined;
    } else if (commandList[0] instanceof Macro) {
      if (commandList[1]?.value != '(') {
        const err = new CompilationError(ErrorName.Macro_MissingOpening,commandList[1],commandList[1],'parseSyntax missing opening');
        output?.outputMessage(err);
        return err;
      }
      if (commandList[commandList.length - 1]?.value != ')') {
        const err = new CompilationError(ErrorName.Macro_MissingClosing,commandList[commandList.length-1],commandList[commandList.length-1],'parseSyntax missing closing');
        output?.outputMessage(err);
        return err;
      }
      const params = this.functionParametersResolve(commandList.slice(2,-1),undefined,warnList,recList);
      if (params instanceof CompilationError) {
        output?.outputMessage(params);
        return params;
      }
      if (this.isRunning) {
        commandList[0].operate(params,output!);
        return;
      } else {
        return commandList[0].validate(params);
      }
    }
    return new CompilationError(ErrorName.IllegalExpression,commandList,commandList,'parseSyntax fallback');
  }
  private parseDeclaration(commandList: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[],focusLine: CodeLine): CompilationError | undefined {
    if (commandList[1] && Interpreter.isValidSymbol(commandList[1].value,true)) { //valid name
      if (commandList[0].value == 'var') { //variable declaration
        if (commandList[2]?.value == '=') {
          this.saveAsWTF(commandList[1]);
          return new CompilationError(ErrorName.VariableInitValue,commandList.slice(2),commandList[1],'variable init check');
        }
        // else if (commandList.length > 2) {
        //   this.saveAsWTF(commandList[1]);
        //   return new CompilationError(ErrorName.IllegalExpression,commandList.slice(2),commandList.slice(2),'variable init check');
        // }
        else {
          // console.log('%c declaring','color:orange',commandList[1].value);
          const commaSplitValues: AbstractSymbol[][] = [[]];
          for (let i = 1; i < commandList.length; i++) { //split via comma values
            if (commandList[i].value == ',') {
              commaSplitValues.push([]);
            } else {
              commaSplitValues[commaSplitValues.length-1].push(commandList[i]);
            }
          }
          for (const splitValues of commaSplitValues) {
            const result = this.fullyResolve(splitValues,warnList,recList,true);
            if (result.error) {
              return result.error;
            }
            if (result.list.length != 1) {
              return new CompilationError(ErrorName.NonResolved,splitValues,splitValues,'parseDecl var non-resolve');
            }
            const single = result.list[0];
            if (single instanceof Variable) {
              if (single.name == undefined) {
                return new CompilationError(ErrorName.IllegalExpression,single,single,'parseDecl var no name');
              }
              console.log('%c declaring','color:orange',single.name);
              this.symbolMap.set(single.name!,single);
            } else if (single instanceof ProxySymbol) {
              single.displayAsVariable = true;
              const addingValue = new Variable(single.index,focusLine,single.value as string);
              this.symbolMap.set(addingValue.name!,addingValue);
              console.log('%c declaring','color:orange',single.value);
            } else {
              return new CompilationError(ErrorName.IllegalExpression,single,single,'parseDecl non var non proxy');
            }
          }
          // const addingValue = new Variable(commandList[1].index,focusLine,commandList[1].value as string);
          // if (commandList[1] instanceof ProxySymbol) {
          //   commandList[1].displayAsVariable = true;
          // }
          // this.symbolMap.set(addingValue.name!,addingValue);
          // commandList[1] = addingValue;
        }
      } else { //value declaration
        if (commandList[2]?.value != '=') { //invalid delcaration
          this.saveAsWTF(commandList[1]);
          return new CompilationError(ErrorName.EqualsSignExpected,commandList,commandList[2],'after checking for declaration');
        }
        const finalResult = this.fullyResolve(commandList.slice(3),warnList,recList,commandList[0].value == 'vvec');
        if (finalResult.error) {
          this.saveAsWTF(commandList[1]);
          return finalResult.error;
        }
        const rhs = finalResult.list;
        if (rhs.length != 1) {
          this.saveAsWTF(commandList[1]);
          return new CompilationError(ErrorName.NonResolved,rhs,commandList[1],'pre-save value');
        }
        if (!Interpreter.isStorableSymbol(rhs[0])) {
          this.saveAsWTF(commandList[1]);
          return new CompilationError(ErrorName.IllegalExpression,commandList,undefined,'check for storable value '+rhs[0].type);
        }
        if (rhs[0].castableTo(commandList[0].value as SymbolType)) { //correct data type
          const storingValue = rhs[0].castTo(commandList[0].value as StorableSymbolType)!;
          if (storingValue.type != commandList[0].value && commandList[0].value != 'any') {
            return new CompilationError(ErrorName.MismatchedDataTypes,storingValue,storingValue,'final rhs type check');
          }
          if (commandList[1].type == 'proxy') {
            commandList[1] = storingValue.rename(commandList[1].index,commandList[1].text as string,focusLine);
            if (commandList[0].value == 'any' && commandList[1] instanceof StorableSymbol) {
              commandList[1].displayAsAny = true;
            }
          }
          return this.saveSymbol(commandList[1],focusLine);
        } else { //incorrect data type
          this.saveAsWTF(commandList[1]);
          return new CompilationError(ErrorName.MismatchedDataTypes,[commandList[1],rhs[0]],rhs[0],'after rhs data type check');
        }
      }
    } else { //invalid name
      if (commandList[1] && this.symbolMap.has(commandList[1].name!)) { //redeclaration
        return new CompilationError(ErrorName.DuplicateDeclarations,commandList[1],commandList[1],'first check');
      } else { //random symbol
        return new CompilationError(ErrorName.IllegalSymbol,commandList[1],commandList[1],'first check');
      }
    }
  }

  private fullyResolve(list: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[],allowVarDec: boolean,groupingLevel: number = 0): IResolutionResult {
    for (let i = 0; i < list.length; i++) { //preprocessing
      //insert multiplication signs
      if (i < list.length - 1 && list[i].type == 'num' && list[i].name == undefined && (list[i+1].type == 'num' || list[i+1].type == 'var' || list[i+1].type == 'alias' || list[i+1].type == 'nvec')) {
        const mult = new Multiplication(-1,list[0].line,'*');
        mult.priority += (MAX_OPERATOR_PRIORITY + 1) * groupingLevel;
        list.splice(i+1,0,mult);
      }
      //replace with booleans
      // if (list[i].value == 'true' || list[i].value == 'false') {
      //   list[i] = new BooleanValue(list[i].index,list[i].line,list[i].value=='true',list[i].value as string);
      // }
    }
    if (list.length <= 1) {
      return {list:list};
    }
    let oshlop = 0;
    let error: CompilationError | undefined;
    while (oshlop++ < 1e1) {
      const evaluated = this.singleResolve(list,warnList,recList,allowVarDec);
      list = evaluated.list;
      error ??= evaluated.error;
      if (evaluated.list.length <= 1 || evaluated.error != undefined) {
        break;
      }
    }
    return {list:list,error:error};
  }
  private singleResolve(list: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[],allowVarDec: boolean): IResolutionResult {
    if (list.length <= 1) {
      return {list:list};
    }
    for (let i = 1; i < list.length - 1; i++) { //dot operator
      if (list[i].value == '.' && list[i-1] instanceof KeyableSymbol) {
        list[i].displayAsOperator = true;
        const next = list[i+1];
        const result = (list[i-1] as AbstractKeyable).getNamedProperty(next,list[i].line);
        if (result instanceof CompilationError) {
          list[i+1].displayAsProxy = true;
          return {list:list,error:result};
        }
        if (result.type != 'func') {
          next.displayAsIndex = true;
        } else {
          next.displayAsFunction = true;
        }
        next.overridePreview = result.preview;
        result.consumeEnd(list[i-1]);
        result.consumeEnd(list[i]);
        result.consumeEnd(list[i+1]);
        list[i-1] = result;
        list.splice(i,2);
      }
    }
    for (let i = 1; i < list.length - 1; i++) { //consume parentheses
      if (list[i-2]?.type != 'func' && list[i-1].value == '(' && list[i+1].value == ')') {
        list[i].consumeStart(list[i-1]);
        list[i].consumeEnd(list[i+1]);
        list.splice(i-1,1);
        list.splice(i,1);
      }
    }
    if (list.some(e => e.value == 'fa')) { //fafo
      const faIndex = list.findIndex(e => e.value == 'fa');
      const foIndex = list.slice(faIndex+1).findIndex(e => e.value == 'fo') + faIndex + 1;
      let endIndex: number | undefined;
      if (list[faIndex-1]?.value == '(') {
        for (let i = foIndex; i < list.length; i++) {
          if (list[i] instanceof GroupingSymbol && (list[i] as AbstractGroupingSymbol).matches(list[faIndex-1])) {
            endIndex = i - 1;
          }
        }
      } else {
        endIndex = list.length - 1;
      }
      if (endIndex == undefined) {
        return {list:list,error:new CompilationError(ErrorName.IllegalExpression,list,list,'singleResolve fafo no end index')};
      }
      const testValue = list.slice(faIndex+1,foIndex);
      if (testValue.length == 0) {
        return {list:list,error:new CompilationError(ErrorName.FAFO_NoTestValue,list,list,'singleResolve fafo no test')};
      }
      const fallbackValue = list.slice(foIndex+1,endIndex+1);
      if (fallbackValue.length == 0) {
        return {list:list,error:new CompilationError(ErrorName.FAFO_NoFallbackValue,list,list,'singleResolve fafo no test')};
      }
      const testResult = this.fullyResolve(testValue,warnList,recList,false);
      const fallbackResult = this.fullyResolve(fallbackValue,warnList,recList,false);
      let finalValue: AbstractSymbol;
      if (testResult.error || testResult.list.length != 1) { //test did not resolve
        if (fallbackResult.error) { //fallback did not resolve
          return {list:list,error:fallbackResult.error};
        } else if (fallbackResult.list.length != 1) {
          return {list:list,error:new CompilationError(ErrorName.FAFO_NoFallbackResolution,fallbackValue,fallbackValue,'singleReolve fafo fallback')};
        } else {
          finalValue = fallbackResult.list[0].clone(-1);
          for (const sym of testValue) {
            sym.suppressError = true;
          }
        }
      } else {  
        finalValue = testResult.list[0].clone(-1);
        for (const sym of fallbackValue) {
          sym.suppressError = true;
        }
      }
      for (let i = faIndex; i <= endIndex; i++) {
        finalValue.consumeEnd(list[i]);
      }
      return {list:[...list.slice(0,faIndex),finalValue,...list.slice(endIndex+1)]};
    }
    let highestPriorityOperator: AbstractOperator | undefined;
    let innermostFunction: BuiltInFunction | undefined;
    let innermostFunctionLevel = -1
    let innerOpeningGrouping: AbstractGroupingSymbol | undefined;
    let innerClosingGrouping: AbstractGroupingSymbol | undefined;
    for (let i = 0; i < list.length; i++) { //find operators and vectors
      const symbol = list[i];
      if (symbol instanceof Operator && (highestPriorityOperator == undefined || symbol.priority > highestPriorityOperator.priority)) {
        highestPriorityOperator = symbol;
      }
      if (symbol instanceof GroupingSymbol && symbol.opening && (innerOpeningGrouping == undefined || symbol.level > innerOpeningGrouping.level)) {
        innerOpeningGrouping = symbol;
      }
      if (symbol instanceof GroupingSymbol && symbol.closing && (innerClosingGrouping == undefined || symbol.level > innerClosingGrouping.level)) {
        innerClosingGrouping = symbol;
      }
      if (symbol instanceof BuiltInFunction) {
        let level = 0;
        if (list[i+1]?.value == '(') {
          level = (list[i+1] as AbstractGroupingSymbol).level;
        }
        if (list[i-1]?.value == '|>') {
          level = Math.max((list[i-1] as Piping).level,level);
        }
        if (innermostFunction == undefined || level > innermostFunctionLevel) {
          innermostFunction = symbol;
          innermostFunctionLevel = level;
        }
      }
    }
    if (innerOpeningGrouping?.value == '{' && innerClosingGrouping?.matches(innerOpeningGrouping)) { //handle variable builder
      const openingIndex = list.indexOf(innerOpeningGrouping);
      const closingIndex = list.indexOf(innerClosingGrouping);
      const priorSymbol = list[openingIndex - 1];
      if (priorSymbol instanceof StorableMatrix) {
        const result = this.indexesResolve(list.slice(openingIndex-1,closingIndex+1),warnList,recList);
        if (result instanceof CompilationError) {
          return {list:list,error:result};
        }
        for (let i = openingIndex - 1; i <= closingIndex; i++) {
          result.consumeEnd(list[i]);
        }
        return {list:[...list.slice(0,openingIndex-1),result,...list.slice(closingIndex+1)]};
      } else {
        const hasVectorOpening = list.slice(0,openingIndex).some(e => e instanceof GroupingSymbol && e.value == '[' && e.level == innerOpeningGrouping!.level - 1);
        const hasVectorClosing = list.slice(closingIndex+1).some(e => e instanceof GroupingSymbol && e.value == ']' && e.level == innerClosingGrouping!.level - 1);
        if (hasVectorOpening && hasVectorClosing) {
          innerOpeningGrouping = list.slice(0,openingIndex).filter(e => e instanceof GroupingSymbol && e.value == '[' && e.level == innerOpeningGrouping!.level - 1).at(-1) as AbstractGroupingSymbol;
          innerClosingGrouping = list.slice(closingIndex+1).filter(e => e instanceof GroupingSymbol && e.value == ']' && e.level == innerClosingGrouping!.level - 1)[0] as AbstractGroupingSymbol;
        } else {
          //TODO: CHANGE
          if (list[openingIndex-1] instanceof Variable || list[openingIndex-1] instanceof ProxySymbol) { //build variable
            const baseSymbol = list[openingIndex - 1];
            let base: string;
            if (baseSymbol instanceof ProxySymbol) {
              baseSymbol.displayAsVariable = true;
              base = baseSymbol.value;
            } else {
              base = baseSymbol.name!;
            }
            const innerValue = this.fullyResolve(list.slice(openingIndex+1,closingIndex),warnList,recList,false);
            if (innerValue.error) {
              return {
                list: list,
                error: innerValue.error
              };
            }
            if (innerValue.list.length != 1) {
              return {
                list: list,
                error: new CompilationError(ErrorName.NonResolved,innerValue.list,innerValue.list,'variable builder const check')
              };
            }
            if (!(innerValue.list[0] instanceof StorableSymbol) || !innerValue.list[0].castableTo('num')) {
              return {
                list: list,
                error: new CompilationError(ErrorName.VarBuild_NonConst,innerValue.list[0],innerValue.list[0],'variable builder const type check')
              };
            }
            const numericalTerminator = innerValue.list[0].castTo('num');
            if (!numericalTerminator.isInteger) {
              return {
                list: list,
                error: new CompilationError(ErrorName.VarBuild_NonInteger,innerValue.list,innerValue.list,'variable builder const int check')
              };
            }
            if (numericalTerminator.value < 0) {
              return {
                list: list,
                error: new CompilationError(ErrorName.VarBuild_Negative,innerValue.list,innerValue.list,'variable builder const<0')
              };
            }
            const alreadyDeclared = this.symbolMap.has(base + numericalTerminator.value.toFixed());
            if (!alreadyDeclared && allowVarDec) {
              this.saveSymbol(new Variable(-1,list[0].line,base + numericalTerminator.value.toFixed()),list[0].line);
            } else if (!alreadyDeclared && !allowVarDec) {
              return {
                list: list,
                error: new CompilationError(ErrorName.IllegalVariableDeclaration,list.slice(openingIndex,closingIndex+1),undefined,'allowVarDec check')
              };
            }
            const declaredVariable = this.symbolMap.get(base + numericalTerminator.value.toFixed())!.clone(-1);
            for (let i = openingIndex - 1; i <= closingIndex; i++) {
              declaredVariable.consumeEnd(list[i]);
            }
            return {list:[...list.slice(0,openingIndex-1),declaredVariable,...list.slice(closingIndex+1)]};
          } else {
            return {
              list: list,
              error: new CompilationError(ErrorName.IllegalExpression,list.slice(openingIndex,closingIndex+1),undefined,'"{}" check')
            };
          }
        }
      }
    }
    if (innerOpeningGrouping?.value == '[' && innerClosingGrouping?.matches(innerOpeningGrouping)) { //handle vector
      const openingIndex = list.indexOf(innerOpeningGrouping);
      const closingIndex = list.indexOf(innerClosingGrouping);
      const rawPriorSymbol = list[openingIndex - 1];
      if (rawPriorSymbol instanceof GenericVector || (rawPriorSymbol instanceof StorableSymbol && rawPriorSymbol.castableTo('str'))) { //extract value from vector
        const result = this.indexesResolve(list.slice(openingIndex-1,closingIndex+1),warnList,recList);
        if (result instanceof CompilationError) {
          return {list:list,error:result};
        }
        for (let i = openingIndex - 1; i <= closingIndex; i++) {
          result.consumeEnd(list[i]);
        }
        return {list:[...list.slice(0,openingIndex-1),result,...list.slice(closingIndex+1)]};
      } else { //build new vector
        const vectorSymbols = list.slice(openingIndex,closingIndex+1);
        const result: IResolutionResult = vectorSymbols.some(e => e.value == 'for')?
          this.constructedVectorResolve(vectorSymbols,warnList,recList,allowVarDec):
          this.enumeratedVectorResolve(vectorSymbols,warnList,recList,allowVarDec);
        if (result.error) {
          return {list:list,error:result.error};
        }
        if (result.list.length != 1) {
          return {
            list: list,
            error: new CompilationError(ErrorName.Vector_EvaluationError,vectorSymbols,vectorSymbols,'build vector resolve check')
          };
        }
        return {list:[...list.slice(0,openingIndex),result.list[0],...list.slice(closingIndex+1)]};
      }
    }
    if (innermostFunction != undefined) {
      let startIndex = list.indexOf(innermostFunction);
      const parentheseIndex = startIndex + 1;
      let endIndex = startIndex;
      let pipedResult: AbstractSymbol | undefined;
      if (list[startIndex+1]?.value == '(') { //find closing parentheses
        while (endIndex < list.length) {
          if (list[endIndex] instanceof GroupingSymbol && (list[endIndex] as AbstractGroupingSymbol).matches(list[startIndex+1])) {
            break;
          }
          endIndex++;
        }
      }
      if (list[startIndex-1] instanceof Piping) { //include piping
        pipedResult = list[startIndex-2];
        startIndex -= 2;
      }
      const paramValues = this.functionParametersResolve(list.slice(parentheseIndex+1,endIndex),pipedResult,warnList,recList);
      if (paramValues instanceof CompilationError) {
        return {list:list,error:paramValues};
      }
      const returnValue = innermostFunction.operate(paramValues);
      if (returnValue instanceof CompilationError) {
        return {list:list,error:returnValue};
      }
      for (const warn of returnValue.warnings ?? []) {
        warnList.push(warn);
      }
      for (let i = startIndex; i <= endIndex; i++) {
        returnValue.value.consumeEnd(list[i]);
      }
      return {list:[...list.slice(0,startIndex),returnValue.value,...list.slice(endIndex+1)]};
    }
    if (list.some(e => Interpreter.predicates.includes(e.value as string))) {
      const isIndex = list.findIndex(e => e.value == 'is');
      // const areIndex = list.findIndex(e => e.value == 'are');
      const canIndex = list.findIndex(e => e.value == 'can');
      const index = Math.min(
        isIndex==-1?Infinity:isIndex,
        // areIndex==-1?Infinity:areIndex,
        canIndex==-1?Infinity:canIndex,
      );
      const usingCan = index == canIndex;
      if (list[index+1]?.type == 'declaration' && list[index-1]) {
        const boolResult = new BooleanValue(-1,list[index].line,
          usingCan?list[index-1].castableTo(list[index+1].text as StorableSymbolType):list[index+1].text==list[index-1].type,
        '');
        boolResult.consumeEnd(list[index-1]);
        boolResult.consumeEnd(list[index]);
        boolResult.consumeEnd(list[index+1]);
        return {list:[...list.slice(0,index-1),boolResult,...list.slice(index+2)]};
      } else {
        return {list:list,error:new CompilationError(ErrorName.IsAre_NonDeclaration,list[index+1],list[index+1],'singleResolve is/are non decl')};
      }
    }
    if (list.some(e => e.value == 'in')) {
      const inIndex = list.findIndex(e => e.value == 'in');
      let boolResult: boolean | undefined;
      if (list[inIndex-1]?.castableTo('str') && list[inIndex+1]?.castableTo('str')) {
        boolResult = list[inIndex+1].castTo('str').rawValue.includes(list[inIndex-1].castTo('str').rawValue);
      } else if (list[inIndex+1] instanceof GenericVector && list[inIndex-1]?.castableTo((list[inIndex+1] as AbstractVector)?.innerType)) {
        let found = false;
        const innerType = (list[inIndex+1] as AbstractVector).innerType;
        for (const elem of (list[inIndex+1] as AbstractVector).value) {
          if (elem.castableTo(innerType) && list[inIndex-1].castTo(innerType).equals(elem.castTo(innerType))) {
            found = true;
            break;
          }
        }
        boolResult = found;
      }
      if (boolResult == undefined) {
        return {
          list: list,
          error: new CompilationError(ErrorName.In_InvalidOperands,[list[inIndex-1],list[inIndex+1]],[list[inIndex-1],list[inIndex+1]],'')
        }
      }
      const result = new BooleanValue(-1,list[inIndex].line,boolResult,'');
      result.consumeEnd(list[inIndex-1]);
      result.consumeEnd(list[inIndex]);
      result.consumeEnd(list[inIndex+1]);
      return {list:[...list.slice(0,inIndex-1),result,...list.slice(inIndex+2)]};
    }
    if (list.some(e => e.value == 'keyof')) {
      const keyIndex = list.findIndex(e => e.value == 'keyof');
      const key = list[keyIndex-1];
      const vector = list[keyIndex+1];
      if (!key?.castableTo('str')) {
        return {list:list,error:new CompilationError(ErrorName.SIndex_NonString,key,key,'singleResolve keyof str check')};
      }
      if (!(vector instanceof KeyableSymbol)) {
        return {list:list,error:new CompilationError(ErrorName.SIndex_KeyNonVector,vector,vector,'singleResolve keyof vec check')};
      }
      let boolResult = false;
      if (vector.propertyNames) {
        boolResult = vector.propertyNames!.includes(key.castTo('str').rawValue);
      } else {
        warnList.push(new CompilationWarning(WarningName.SIndex_DNE,vector,vector,'singleResolve indexes exist check'));
      }
      return {list:[...list.slice(0,keyIndex-1),new BooleanValue(-1,vector.line,boolResult,''),...list.slice(keyIndex+2)]};
    }
    if (highestPriorityOperator) {
      if (highestPriorityOperator.value == '?') {
        const questionIndex = list.indexOf(highestPriorityOperator);
        let startIndex = questionIndex;
        let openingParenthesis: GroupingSymbol<'('> | undefined;
        while (startIndex > 0) {
          startIndex--;
          if (list[startIndex].value == '(') {
            openingParenthesis = list[startIndex] as GroupingSymbol<'('>;
            startIndex++;
            break;
          }
        }
        let endIndex: number = questionIndex;
        if (openingParenthesis == undefined) {
          endIndex = list.length - 1;
        } else {
          while (endIndex < list.length) {
            endIndex++;
            if (openingParenthesis.matches(list[endIndex])) {
              endIndex--;
              break;
            }
          }
        }
        let questionMarkLevel = 1;
        let colonIndex = -1;
        for (let i = questionIndex + 1; i <= endIndex; i++) { //find matching colon
          if (list[i].value == '?') {
            questionMarkLevel++;
          }
          if (list[i].value == ':') {
            questionMarkLevel--;
          }
          if (questionMarkLevel == 0) {
            colonIndex = i;
            break;
          }
        }
        if (colonIndex == -1) {
          return {list:list,error:new CompilationError(ErrorName.IfElse_MissingColon,highestPriorityOperator,highestPriorityOperator,'singleResolve colon check')};
        }
        if (questionIndex + 1 == colonIndex) {
          return {list:list,error:new CompilationError(ErrorName.IfElse_MissingTrueValue,list.slice(startIndex,endIndex+1),list.slice(startIndex,endIndex+1),'singleResolve ?: missing true value')};
        }
        if (colonIndex == endIndex) {
          return {list:list,error:new CompilationError(ErrorName.IfElse_MissingFalseValue,list.slice(startIndex,endIndex+1),list.slice(startIndex,endIndex+1),'singleResolve ?: missing false value')};
        }
        const boolList = list.slice(startIndex,questionIndex);
        const boolResult = this.fullyResolve(boolList,warnList,recList,false);
        if (boolResult.error) {
          return {list:list,error:boolResult.error};
        }
        if (boolResult.list.length != 1) {
          return {list:list,error:new CompilationError(ErrorName.IfElse_CondNonResolved,boolList,boolList,'singleResolve ?: non resolution')};
        }
        const potentialBoolValue = boolResult.list[0];
        if (!(potentialBoolValue instanceof StorableSymbol) || !potentialBoolValue.castableTo('bool')) {
          return {list:list,error:new CompilationError(ErrorName.IfElse_NonBoolean,potentialBoolValue,potentialBoolValue,'singleResolve ?: non bool')};
        }
        const boolValue = potentialBoolValue.castTo('bool');
        const otherList = !boolValue.value?list.slice(questionIndex+1,colonIndex):list.slice(colonIndex+1,endIndex+1);
        const otherResult = this.fullyResolve(otherList,warnList,recList,false);
        if (otherResult.error) {
          return {list:list,error:otherResult.error};
        }
        if (otherResult.list.length != 1) {
          return {list:list,error:new CompilationError(ErrorName.IfElse_NonResolved,otherList,otherList,'singleResolve ?: other value')};
        }
        const valueList = boolValue.value?list.slice(questionIndex+1,colonIndex):
          list.slice(colonIndex+1,endIndex+1);
        const valueResult = this.fullyResolve(valueList,warnList,recList,false);
        if (valueResult.error) {
          return {list:list,error:valueResult.error};
        }
        if (valueResult.list.length != 1) {
          return {list:list,error:new CompilationError(ErrorName.IfElse_ValueNonResolved,valueList,valueList,'singleResolve ?: non resolution')};
        }
        const finalValue = valueResult.list[0].clone(-1);
        for (let i = startIndex; i <= endIndex; i++) {
          finalValue.consumeEnd(list[i]);
        }
        return {list:[...list.slice(0,startIndex),finalValue,...list.slice(endIndex+1)]};
      } else {
        const result = highestPriorityOperator.operate(list);
        if (result instanceof CompilationError) {
          return {list:list,error:result};
        }
        if (result.warning) {
          warnList.push(result.warning);
        }
        if (result.recommendation) {
          recList.push(result.recommendation);
        }
        return {list:result.list};
      }
    }
    if (list.some(e => e instanceof Spread)) {
      const spreadIndex = list.findIndex(e => e instanceof Spread);
      if (!list[spreadIndex+1]?.castableTo('list')) {
        return {
          list: list,
          error: new CompilationError(ErrorName.Spread_NonVector,list[spreadIndex+1],list[spreadIndex+1],'singleResolve ...non-list')
        };
      }
      const vector = list[spreadIndex+1].castTo('list');
      if (vector.size > Spread.MAX_SIZE) {
        return {
          list: list,
          error: new CompilationError(ErrorName.Spread_SizeLimit,list[spreadIndex+1],list[spreadIndex+1],'singleResolve ...non-list')
        };
      }
      const injectedList: AbstractSymbol[] = [];
      for (let i = 0; i < vector.size; i++) {
        const clone = vector.value[i].clone(-1,undefined,list[spreadIndex].line);
        clone.consumeStart(list[spreadIndex]);
        clone.consumeStart(vector);
        injectedList.push(clone);
        if (i != vector.size - 1) {
          injectedList.push(new BasicSymbol(-1,list[spreadIndex].line,',','operator'));
        }
      }
      return {
        list: [...list.slice(0,spreadIndex),...injectedList,...list.slice(spreadIndex+2)]
      };
    }
    return {list:list};
  }
  // ~ BELOW TAKE SHORTENED LISTS ~
  private indexesResolve(vectorSubList: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[]): AbstractStorable | CompilationError {
    // console.log('indexesresolve');
    let parentVector = vectorSubList[0];
    if (parentVector instanceof StorableSymbol && parentVector.castableTo('str')) {
      parentVector = parentVector.castTo('str').asStringVector;
    }
    if (!(parentVector instanceof KeyableSymbol)) {
      return new CompilationError(ErrorName.IllegalExpression,vectorSubList,vectorSubList,'indexesResolve non-vector');
    }
    const mode = vectorSubList[1].value=='['?'row':'col';
    if (mode == 'col' && !(parentVector instanceof StorableMatrix)) {
      return new CompilationError(ErrorName.Index_ColumnNonMatrix,parentVector,parentVector,'indexesResolve column matrix check');
    }
    const indexSubList = vectorSubList.slice(2,-1);
    const colonCount = indexSubList.filter(e => e.value == ':').length;
    let result: AbstractStorable | CompilationError | undefined;
    const filtering = indexSubList.some(e => ['==','~=','>','>=','<=','<',...Interpreter.predicates].includes(e.value as string));
    const validLHS = filtering && (indexSubList.some(e => e.value == 'val') ||
      (parentVector instanceof DataFrame && indexSubList.some(e => e.type != 'str' && (parentVector as DataFrame).columnNames.includes(e.value as string))));
    // console.trace();
    // console.log('filter',filtering,'has val',indexSubList.some(e => e.value == 'val'),validLHS);
    if (parentVector instanceof GenericVector && filtering && validLHS) { //boolean filtering
      if (parentVector instanceof DataFrame) {
        const filteredRows: AbstractVector[] = [];
        for (let r = 0; r < parentVector.size; r++) {
          const row = parentVector.get(r,vectorSubList[0].line);
          if (row instanceof CompilationError) {
            continue;
          }
          const subListCopy = indexSubList.slice();
          for (let i = 0; i < subListCopy.length; i++) {
            if (subListCopy[i].value == 'val') {
              subListCopy[i] = new NumberValue(-1,vectorSubList[0].line,r+1,'');
            } else if (row.propertyNames?.includes(subListCopy[i].value as string)) {
              indexSubList[i].displayAsIndex = true;
              subListCopy[i] = row.getNamedProperty(subListCopy[i],vectorSubList[0].line) as AbstractStorable;
            }
          }
          // console.log(r,subListCopy);
          // console.log('copy',subListCopy);
          const boolResult = this.fullyResolve(subListCopy,warnList,recList,false);
          if (boolResult.error) {
            return boolResult.error;
          }
          if (boolResult.list.length != 1 || !(boolResult.list[0] instanceof StorableSymbol) || !boolResult.list[0].castableTo('bool')) {
            return new CompilationError(ErrorName.FIndex_NonBoolean,indexSubList,indexSubList,'indexesResolve non-bool')
          }
          if (boolResult.list[0].castTo('bool').value === true) {
            filteredRows.push(row);
          }
        }
        result = DataFrame.FromRows(filteredRows,vectorSubList[0].line,parentVector.columnNames);
      } else {
        const filteredList: AbstractStorable[] = [];
        for (const val of parentVector.value) {
          const subListCopy = indexSubList.slice();
          for (let i = 0; i < subListCopy.length; i++) {
            if (subListCopy[i].value == 'val') {
              subListCopy[i] = val.clone(-1);
            }
          }
          const boolResult = this.fullyResolve(subListCopy,warnList,recList,false);
          if (boolResult.error) {
            return boolResult.error;
          }
          if (boolResult.list.length != 1 || !(boolResult.list[0] instanceof StorableSymbol) || !boolResult.list[0].castableTo('bool')) {
            return new CompilationError(ErrorName.FIndex_NonBoolean,indexSubList,indexSubList,'indexesResolve non-bool')
          }
          if (boolResult.list[0].castTo('bool').value === true) {
            filteredList.push(val);
          }
        }
        result = GenericVector.FromArray(filteredList,vectorSubList[0].line);
      }
    } else if (parentVector instanceof GenericVector && (colonCount == 1 || colonCount == 2)) { //slice
      // console.log('slicing');
      const slices = this.slicesResolve(indexSubList,warnList,recList);
      if (slices instanceof CompilationError) {
        return slices;
      }
      const result = mode=='row'?parentVector.slice(slices.start,slices.end,slices.step,parentVector.line):
        (parentVector as AbstractMatrix).sliceColumn(slices.start,slices.end,slices.step,parentVector.line);
      // console.log('slice result',result);
      if (result instanceof CompilationError) {
        return result;
      }
      console.log(result,parentVector);
      if (parentVector instanceof DataFrame && Array.isArray(result)) {
        return DataFrame.FromRows(result,parentVector.line,parentVector.columnNames);
      }
      return result;
    } else { //pulling specific index(es)
      const indexResult = this.fullyResolve(indexSubList,warnList,recList,false);
      if (indexResult.error) {
        return indexResult.error;
      }
      if (indexResult.list.length != 1) {
        return new CompilationError(ErrorName.Index_NonSingularValue,indexSubList,indexSubList,'indexesResolve single value check');
      }
      const index = indexResult.list[0];
      if (index instanceof StorableSymbol && (index.castableTo('num') || index.castableTo('str'))) {
        if (!index.castableTo('num') && mode == 'col') {
          return new CompilationError(ErrorName.SIndex_Column,index,index,'indexesResolve column name check');
        }
        if (index.castableTo('str') && parentVector instanceof KeyableSymbol) {
          result = parentVector.getNamedProperty(index.castTo('str'),parentVector.line) as CompilationError;
        } else if (parentVector instanceof GenericVector) {
          result = (
            mode=='row'?
            parentVector.getFromSymbol(index.castableTo('num')?index.castTo('num'):index.castTo('str'),parentVector.line):
            (parentVector as AbstractMatrix).getColumnFromConstant(index.castTo('num'))
          ) as CompilationError;
        }
      } else if (parentVector instanceof GenericVector && index instanceof GenericVector && (index.castableTo('nvec') || index.castableTo('svec'))) {
        if (!index.castableTo('nvec') && mode == 'col') {
          return new CompilationError(ErrorName.SIndex_Column,index,index,'indexesResolve column name check');
        }
        const pulledValues: AbstractStorable[] = [];
        for (const val of (index.castableTo('nvec')?index.castTo('nvec'):index.castTo('svec')).value) {
          const innerValue = mode=='row'?parentVector.getFromSymbol(val,parentVector.line):
            (parentVector as AbstractMatrix).getColumnFromConstant(val as NumberValue);
          if (innerValue instanceof CompilationError) {
            return innerValue;
          }
          pulledValues.push(innerValue as AbstractStorable);
        }
        result = GenericVector.FromArray(pulledValues,vectorSubList[0].line);
      } else {
        return new CompilationError(ErrorName.Index_NonConstantString,index,index,'indexesResolver type check');
      }
    }
    if (result == undefined) {
      return new CompilationError(ErrorName.IllegalExpression,vectorSubList,vectorSubList,'indexesResolve non-vector');
    }
    if (vectorSubList[0] instanceof StringValue && result instanceof GenericVector && result.castableTo('svec')) {
      return result.castTo('svec').asStringValue;
    }
    return result;
  }
  private slicesResolve(indexList: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[]): {start?:NumberValue,end?:NumberValue,step?:NumberValue} | CompilationError {
    const indexOfFirstColon = indexList.findIndex(e => e.value == ':');
    const indexOfLastColon = indexList.findLastIndex(e => e.value == ':');
    const sliceValues: AbstractSymbol[][] = [
      indexList.slice(0,indexOfFirstColon),
      indexList.slice(indexOfFirstColon+1,indexOfFirstColon==indexOfLastColon ? undefined : indexOfLastColon),
      indexOfFirstColon==indexOfLastColon ? [] : indexList.slice(indexOfLastColon+1)
    ];
    const startSliceIndex = sliceValues[0].length==0 ? undefined : this.fullyResolve(sliceValues[0],warnList,recList,false);
    const endSliceIndex = sliceValues[1].length==0 ? undefined : this.fullyResolve(sliceValues[1],warnList,recList,false);
    const stepSliceIndex = sliceValues[2].length==0 ? undefined : this.fullyResolve(sliceValues[2],warnList,recList,false);
    if (startSliceIndex?.error) {
      return startSliceIndex.error;
    }
    if (endSliceIndex?.error) {
      return endSliceIndex.error;
    }
    if (stepSliceIndex?.error) {
      return stepSliceIndex.error;
    }
    if (startSliceIndex && (startSliceIndex.list.length != 1 || !startSliceIndex.list[0].castableTo('num'))) {
      return new CompilationError(ErrorName.Vector_SliceIllegalType,startSliceIndex.list,startSliceIndex.list,'singleResolve start index type check');
    }
    if (endSliceIndex && (endSliceIndex.list.length != 1 || !endSliceIndex.list[0].castableTo('num'))) {
      return new CompilationError(ErrorName.Vector_SliceIllegalType,endSliceIndex.list,endSliceIndex.list,'singleResolve end index type check');
    }
    if (stepSliceIndex && (stepSliceIndex.list.length != 1 || !stepSliceIndex.list[0].castableTo('num'))) {
      return new CompilationError(ErrorName.Vector_SliceIllegalType,stepSliceIndex.list,stepSliceIndex.list,'singleResolve step index type check');
    }
    return {
      start: (startSliceIndex?.list ?? [])[0]?.castTo('num'),
      end: (endSliceIndex?.list ?? [])[0]?.castTo('num'),
      step: (stepSliceIndex?.list ?? [])[0]?.castTo('num'),
    };
  }
  private enumeratedVectorResolve(list: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[],allowVarDec: boolean): IResolutionResult {
    if (list[0].value != '[') {
      return {
        list: list,
        error: new CompilationError(ErrorName.Vector_InvalidStart,list[0],list[0],'enumerated "[" check')
      };
    }
    if (list[list.length-1].value != ']') {
      return {
        list: list,
        error: new CompilationError(ErrorName.Vector_InvalidStart,list[list.length-1],list[list.length-1],'enumerated "]" check')
      };
    }
    const commaList: AbstractSymbol[] = [];
    const valueMatrix: AbstractSymbol[][] = [[]];
    for (let i = 1; i < list.length - 1; i++) {
      if (list[i].value == ',') {
        commaList.push(list[i]);
        valueMatrix.push([]);
      } else {
        valueMatrix[valueMatrix.length - 1].push(list[i]);
      }
    }
    if (valueMatrix[0].length == 0 && valueMatrix.length == 1) {
      const emptyVector = new EmptyVector(-1,list[0].line,'');
      for (const sym of list) {
        emptyVector.consumeEnd(sym);
      }
      return {list:[emptyVector]};
    }
    const calculatedValues: (AbstractStorable|AbstractStorable[])[] = [];
    const namedIndexList: (string|undefined)[] = [];
    let useNamedIndexes = true;
    let duplicateNameWarning = false;
    for (let i = 0; i < valueMatrix.length; i++) { //find values in each slot
      if (valueMatrix[i].length == 0) {
        return {
          list: list,
          error: new CompilationError(ErrorName.Vector_EmptyValue,undefined,undefined,'enumeratedVectorResolve empty slot')
        };
      }
      let valueList = valueMatrix[i];
      namedIndexList.push(undefined);
      if (valueMatrix[i][0].text.length > 0 && valueMatrix[i][1]?.value == ':') { //named index
        if (namedIndexList.includes(valueMatrix[i][0].text)) {
          if (!duplicateNameWarning) {
            duplicateNameWarning = true;
            useNamedIndexes = false;
            warnList.push(new CompilationWarning(WarningName.SIndex_Duplicate,valueMatrix[i][0],valueMatrix[i][0],''));
          }
        } else {
          namedIndexList[i] = valueMatrix[i][0].text;
        }
        valueMatrix[i][0].displayAsIndex = true;
        valueList = valueMatrix[i].slice(2);
      }
      if (valueList[0] instanceof Spread && valueList[1]?.castableTo('list')) {
        const listObject = valueList[1].castTo('list');
        for (let i = 1; i < listObject.size; i++) {
          namedIndexList.push(undefined);
        }
        calculatedValues.push( listObject.value.slice() );
        continue;
      }
      const slotResult = this.fullyResolve(valueList,warnList,recList,allowVarDec);
      if (slotResult.error) {
        return {list:list,error:slotResult.error};
      }
      if (slotResult.list.length != 1) {
        return {
          list: list,
          error: new CompilationError(ErrorName.Vector_EvaluationError,valueList,valueList,'enumerated single result')
        };
      } else if (!GenericVector.isVectorable(slotResult.list[0])) {
        return {
          list: list,
          error: new CompilationError(ErrorName.Vector_IllegalValue,valueList,valueList,'enumerated const/var check')
        };
      } else {
        calculatedValues.push(slotResult.list[0]);
      }
    }
    // const neededType = calculatedValues[0].type;
    // for (let i = 1; i < calculatedValues.length; i++) { //make sure all values are of same type
    //   if (calculatedValues[i].type != neededType) {
    //     return {
    //       list: list,
    //       error: new CompilationError(ErrorName.Vector_NonStorableValues,list,list,'enumerated single type check')
    //     };
    //   }
    // }
    const resultVector = GenericVector.FromArray(calculatedValues.flat(),list[0].line,useNamedIndexes?namedIndexList:undefined);
    if (resultVector instanceof CompilationError) {
      return {list:list,error:resultVector};
    }
    resultVector.consumeEnd(list[0]);
    for (let i = 0; i < calculatedValues.length; i++) {
      if (!Array.isArray(calculatedValues[i])) {
        resultVector.consumeEnd(calculatedValues[i] as AbstractStorable);
      }
      if (i > 0) {
        resultVector.consumeEnd(commaList[i-1]);
      }
    }
    resultVector.consumeEnd(list[list.length-1]);
    return {list:[resultVector]};
  }
  private constructedVectorResolve(list: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[],allowVarDec: boolean): IResolutionResult {
    if (list[0].value != '[') {
      return {
        list: list,
        error: new CompilationError(ErrorName.Vector_InvalidStart,list[0],list[0],'enumerated "[" check')
      };
    }
    if (list[list.length-1].value != ']') {
      return {
        list: list,
        error: new CompilationError(ErrorName.Vector_InvalidStart,list[list.length-1],list[list.length-1],'enumerated "]" check')
      };
    }
    (list[0] as AbstractGroupingSymbol).marksConstructedVector = true;
    (list[list.length-1] as AbstractGroupingSymbol).marksConstructedVector = true;
    const forStatements: AbstractSymbol[][] = [];
    let indexOfFirstFor: number | undefined;
    const allowedWithList: ReadonlyArray<string> = ['except','include','exindex','prepend','append'];
    const allowed: ReadonlyArray<string> = ['step','to','until','=',...allowedWithList];
    for (let i = 1; i < list.length - 1; i++) { //split into for statements
      if (list[i].value == 'for') {
        indexOfFirstFor ??= i;
        forStatements.push([list[i]]);
      } else if (indexOfFirstFor != undefined) {
        forStatements[forStatements.length - 1].push(list[i]);
      }
    }
    if (indexOfFirstFor == undefined) {
      return {
        list: list,
        error: new CompilationError(ErrorName.IllegalExpression,list,list,'constructVector no "for"')
      };
    }
    const rangeDict: Record<string,IVectorRange> = {};
    const listDict: Record<string,number[]> = {};
    for (let i = 1; i < indexOfFirstFor; i++) {
      if (list[i] instanceof ProxySymbol) {
        rangeDict[(list[i] as ProxySymbol).value] = {};
      }
    }
    for (const statement of forStatements) {
      if (!(statement[1] instanceof ProxySymbol)) {
        return {
          list: list,
          error: new CompilationError(ErrorName.For_NoIteratingSymbol,statement,statement,'constructedVector proxy check')
        };
      }
      if (!(statement[1].value in rangeDict)) {
        return {
          list: list,
          error: new CompilationError(ErrorName.For_UnusedIteratingSymbol,statement[1],statement[1],'constructedVector present check')
        }
      }
      if (statement[1].value in listDict) {
        return {
          list: list,
          error: new CompilationError(ErrorName.For_DuplicateIteratingSymbol,statement[1],statement[1],'constructedVector present check')
        }
      }
      statement[1].displayAsVariable = true;
      if (statement[2]?.value == 'in') { //for x in cvec
        const vectorResult = this.fullyResolve(statement.slice(3),warnList,recList,false);
        if (vectorResult.error) {
          return {list:list,error:vectorResult.error};
        }
        if (vectorResult.list.length != 1) {
          return {
            list: list,
            error: new CompilationError(ErrorName.NonResolved,statement.slice(3),statement.slice(3),'constructedVector for..in non-resolve')
          };
        }
        if (!vectorResult.list[0].castableTo('nvec')) {
          return {
            list: list,
            error: new CompilationError(ErrorName.For_NonVector,vectorResult.list[0],vectorResult.list[0],'constructedVector for..in non-vector')
          }
        }
        listDict[statement[1].value] = vectorResult.list[0].castTo('nvec').asNumberArray;
      } else { //for x=a to/until b
        if (statement[2]?.value != '=') {
          return {
            list: list,
            error: new CompilationError(ErrorName.For_UnknownCommand,statement[2],statement[2],'constructedVector "for" keyword check')
          }
        }
        const keywords: number[] = [];
        for (let i = 2; i < statement.length; i++) {
          if (allowed.includes(statement[i].value as string)) {
            keywords.push(i);
          }
        }
        keywords.push(statement.length);
        for (let i = 0; i < keywords.length - 1; i++) {
          const prop = statement[keywords[i]].value=='='?'from':statement[keywords[i]].value as keyof IVectorRange;
          const propList = statement.slice(keywords[i]+1,keywords[i+1]);
          const propValue = this.fullyResolve(propList,warnList,recList,allowVarDec,(list[0] as AbstractGroupingSymbol).level);
          if (propValue.error) {
            return {list:list,error:propValue.error};
          }
          if (propValue.list.length != 1) {
            return {
              list: list,
              error: new CompilationError(ErrorName.For_CommandInvalidDataType,propValue.list,propValue.list,'constructVector "for" data type')
            };
          }
          if (propValue.list[0].castableTo('num')) {
            if (allowedWithList.includes(prop)) {
              rangeDict[statement[1].value][prop as 'except'] = [propValue.list[0].castTo('num').value];
            } else {
              rangeDict[statement[1].value][prop as 'step'] = propValue.list[0].castTo('num').value;
            }
          } else if (allowedWithList.includes(prop) && propValue.list[0].castableTo('nvec')) {
            rangeDict[statement[1].value][prop as 'except'] = propValue.list[0].castTo('nvec').asNumberArray;
          } else {
            return {
              list: list,
              error: new CompilationError(ErrorName.For_CommandInvalidDataType,propValue.list,propValue.list,'constructVector for data type')
            };
          }
        }

        const rangeResult = NumberVector.buildRange(rangeDict[statement[1].value],statement[1]);
        if (rangeResult instanceof CompilationError) {
          return {list:list,error:rangeResult};
        }
        listDict[statement[1].value] = rangeResult;
      }
    }
    let minLength = Infinity;
    for (const name in listDict) {
      minLength = Math.min(listDict[name].length,minLength);
    }
    if (minLength == Infinity) {
      return {
        list: list,
        error: new CompilationError(ErrorName.IllegalExpression,list,list,'constructedVector min length')
      };
    }
    if (minLength == 0) {
      const emptyVector = new EmptyVector(-1,list[0].line,'');
      for (const sym of list) {
        emptyVector.consumeEnd(sym);
      }
      return {list:[emptyVector]};
    }
    for (let i = 0; i < indexOfFirstFor; i++) {
      if (list[i] instanceof ProxySymbol) {
        (list[i] as ProxySymbol).displayAsVariable = true;
      }
    }
    const values: Vectorable[] = [];
    for (let i = 0; i < minLength; i++) {
      const iterList = list.slice(1,indexOfFirstFor);
      for (let j = 0; j < iterList.length; j++) {
        if (iterList[j] instanceof ProxySymbol && (iterList[j].value as string) in listDict) {
          iterList[j] = new NumberValue(-1,list[0].line,listDict[iterList[j].value as string][i],'',iterList[j].value as string);
        }
      }
      const iterValue = this.fullyResolve(iterList,warnList,recList,allowVarDec,(list[0] as AbstractGroupingSymbol).level);
      if (iterValue.error) {
        return {
          list: list,
          error: iterValue.error
        };
      }
      if (iterValue.list.length != 1 || !GenericVector.isVectorable(iterValue.list[0])) {
        return {
          list: list,
          error: new CompilationError(ErrorName.Vector_IllegalValue,list,list,'constructedVector var/const check')
        };
      }
      values.push(iterValue.list[0]);
    }
    const result = GenericVector.FromArray(values,list[0].line);
    if (result instanceof CompilationError) {
      return {
        list: list,
        error: result
      };
    }
    for (const symbol of list) {
      result.consumeEnd(symbol);
    }
    return {list:[result]};
  }
  private functionParametersResolve(list: AbstractSymbol[],piped: AbstractSymbol | undefined,warnList: CompilationWarning[],recList: CompilationRecommendation[]): IFunctionInput[] | CompilationError {
    const input: IFunctionInput[] = piped&&!list.some(e => e instanceof BasicSymbol && e.value=='result')?[{symbol:piped}]:[];
    let paramSplit: AbstractSymbol[] = [];
    for (let i = 0; i <= list.length && list.length > 0; i++) {
      if (i == list.length || list[i].value == ',') { //parse parameter
        let paramName: string | undefined;
        let paramValue = paramSplit;
        if (paramSplit[1]?.value == '=') {
          paramSplit[0].displayAsParam = true;
          paramName = KeyableSymbol.getPropName(paramSplit[0]);
          paramValue = paramSplit.slice(2);
        }
        for (let i = 0; i < paramValue.length; i++) {
          if (paramValue[i] instanceof BasicSymbol && paramValue[i].value == 'result') {
            if (piped) {
              paramValue[i] = piped;
            } else {
              return new CompilationError(ErrorName.Fxn_ResultNoPipe,paramValue[i],paramValue[i],'fxnParamResolve result no pipe');
            }
          }
        }
        if (paramValue.length == 0) {
          return new CompilationError(ErrorName.IllegalExpression,list,list,'fxnParamResolve empty param');
        } else if (paramValue.length == 1) {
          input.push({name:paramName,symbol:paramValue[0]});
        } else if (paramName != undefined && paramValue[0].value == Spread.shortcut) {
          return new CompilationError(ErrorName.Spread_Named,paramSplit.slice(0,3),paramSplit.slice(0,3),'fxnParamResolve ...named');
        } else {
          const paramResult = this.fullyResolve(paramValue,warnList,recList,false);
          if (paramResult instanceof CompilationError) {
            return paramResult;
          }
          // console.log('PARAM RESULT',paramResult.list.map(e => e.toString()));
          if (paramResult.list.length != 1 && paramValue[0].value != Spread.shortcut) {
            return new CompilationError(ErrorName.NonResolved,list,list,'fxnParamResolve non single');
          }
          for (const val of paramResult.list) {
            if (val.value == ',') {
              continue;
            }
            input.push({name:paramName,symbol:val});
          }
        }
        paramSplit = [];
      } else {
        paramSplit.push(list[i]);
      }
    }
    // console.log('INPUT',input);
    return input;
  }
  private boundResolve(list: AbstractSymbol[],warnList: CompilationWarning[],recList: CompilationRecommendation[]): BoundValue[] | CompilationError {
    // console.log('BOUND RESOLVE');
    const isIndexes = list.map((e,i) => e.value=='is' ? i : -1).filter(e => e != -1);
    if (isIndexes.length > 1) {
      const isValues = list.filter((e,i) => isIndexes.includes(i));
      return new CompilationError(ErrorName.Bound_MultipleIs,isValues,isValues,'boundResolve multiple is');
    } else if (isIndexes.length == 1) {
      const domain = list[isIndexes[0]+1];
      if (isIndexes[0] != list.length - 2) {
        return new CompilationError(ErrorName.Bound_ExtraValues,list.slice(isIndexes[0]+2),list.slice(isIndexes[0]+2),'boundResolve domain check');
      }
      if (!Interpreter.domains.includes(domain?.value as string)) {
        return new CompilationError(ErrorName.Bound_NonDomain,domain,domain,'boundResolve domain check');
      }
      const commaSplitValues: AbstractSymbol[][] = [[]];
      const commaBoundIndexes: number[] = [0];
      for (let i = 0; i < isIndexes[0]; i++) {
        if (list[i].value == ',') {
          commaSplitValues.push([]);
          commaBoundIndexes.push(i);
        } else {
          commaSplitValues[commaSplitValues.length-1].push(list[i]);
        }
      }
      // console.log('COMMA',commaSplitValues.map(e => e.map(e => e.toString())));
      commaBoundIndexes.push(isIndexes[0]-1);
      const boundingValues: Alias[] = [];
      for (let i = 0; i < commaSplitValues.length; i++) {
        // const slot = list.slice(commaBoundIndexes[i],commaBoundIndexes[i+1]+1);
        const slot = commaSplitValues[i];
        // console.log('SLOT',slot);
        if (commaSplitValues[i].length == 0) {
          return new CompilationError(ErrorName.Bound_MissingValue,slot,slot,'boundResolve missing pred slot');
        }
        const slotResult = this.fullyResolve(slot,warnList,recList,false);
        if (slotResult.error) {
          return slotResult.error;
        }
        if (slotResult.list.length != 1) {
          return new CompilationError(ErrorName.NonResolved,list,list,'boundResolve non slot resolve');
        }
        const slotValue = slotResult.list[0];
        if (!slotValue.castableTo('alias') && !slotValue.castableTo('avec')) {
          return new CompilationError(ErrorName.Bound_IllegalType,slotValue,slotValue,'boundResolve non-alias non-avec');
        }
        if (slotValue.castableTo('alias')) {
          boundingValues.push(slotValue.castTo('alias'));
        } else {
          for (const value of slotValue.castTo('avec')) {
            boundingValues.push(value);
          }
        }
      }
      const bounds: BoundValue[] = [];
      for (const value of boundingValues) {
        if (!value.hasVariable) {
          return new CompilationError(ErrorName.Bound_NoVariable,value,value,'boundResolve var check');
        }
        bounds.push(new BoundValue(-1,list[0].line,{
          lhs: value,
          cmp: 'is',
          rhs: new NoneType(-1,list[0].line,''),
          is: domain.value as 'bin'
        },''));
      }
      return bounds;
    }
    const logicalSeparators: (AbstractBinary|AbstractIfThen)[] = [];
    const logicalStatements: AbstractSymbol[][] = [[]];
    for (const sym of list) { //split along binary and if; xor nor & | => <=>
      if (sym instanceof BinaryAndOr || sym instanceof IfThen) {
        logicalSeparators.push(sym);
        logicalStatements.push([]);
      } else {
        logicalStatements[logicalStatements.length-1].push(sym);
      }
    }
    // console.log('LOG SEP',logicalSeparators.map(e => e.toString()));
    // console.log('LOG STA',logicalStatements.map(e => e.map(e => e.toString())));
    const rawSplitBounds: BoundValue[][] = [];
    for (const statement of logicalStatements) {
      if (statement.length == 0) {
        return new CompilationError(ErrorName.Bound_MissingValue,undefined,undefined,'boundResolve empty statement');
      }
      const ineqSeparators: AbstractSymbol[] = [];
      const ineqStatements: AbstractSymbol[][] = [[]];
      for (const sym of statement) {
        if (['>','>=','=','<=','<'].includes(sym.value as string)) {
          ineqSeparators.push(sym);
          ineqStatements.push([]);
        } else {
          ineqStatements[ineqStatements.length-1].push(sym);
        }
      }
      // console.log('INEQ SEP',ineqSeparators.map(e => e.toString()));
      // console.log('INEQ STA',ineqStatements.map(e => e.map(e => e.toString())));
      const boundSides: AbstractStorable[] = [];
      for (const ineqStat of ineqStatements) {
        if (ineqStat.length == 0) {
          return new CompilationError(ErrorName.Bound_MissingValue,undefined,undefined,'boundResolve empty ineqStat')
        }
        const slotResult = this.fullyResolve(ineqStat,warnList,recList,false);
        if (slotResult.error) {
          return slotResult.error;
        }
        if (slotResult.list.length != 1) {
          return new CompilationError(ErrorName.NonResolved,ineqStat,ineqStat,'boundResolve side resolve')
        }
        const slotValue = slotResult.list[0];
        if (slotValue.castableTo('alias') || slotValue.castableTo('avec')) {
          boundSides.push(slotValue as AbstractStorable);
        } else {
          return new CompilationError(ErrorName.Bound_IllegalType,slotValue,slotValue,'boundResolve non-alias non-avec 2');
        }
      }
      const iterBounds: BoundValue[] = [];
      for (let i = 0; i < ineqSeparators.length; i++) {
        const lhs = boundSides[i].castableTo('alias') ? boundSides[i].castTo('alias') : boundSides[i].castTo('avec');
        const rhs = boundSides[i+1].castableTo('alias') ? boundSides[i+1].castTo('alias') : boundSides[i+1].castTo('avec');
        if (lhs instanceof GenericVector && rhs instanceof GenericVector) {
          if (lhs.size != rhs.size) {
            return new CompilationError(ErrorName.Bound_MismatchedSizes,[lhs,rhs],[lhs,rhs],'boundResolve mismatched size');
          }
          for (let j = 0; j < lhs.size; j++) {
            iterBounds.push(new BoundValue(-1,list[0].line,{
              lhs: lhs.value[j],
              cmp: ineqSeparators[i].value as '<',
              rhs: rhs.value[j]
            },''));
          }
        } else if (lhs instanceof GenericVector) {
          for (let j = 0; j < lhs.size; j++) {
            iterBounds.push(new BoundValue(-1,list[0].line,{
              lhs: lhs.value[j],
              cmp: ineqSeparators[i].value as '<',
              rhs: rhs as Alias
            },''));
          }
        } else if (rhs instanceof GenericVector) {
          for (let j = 0; j < rhs.size; j++) {
            iterBounds.push(new BoundValue(-1,list[0].line,{
              lhs: lhs as Alias,
              cmp: ineqSeparators[i].value as '<',
              rhs: rhs.value[j]
            },''));
          }
        } else {
          iterBounds.push(new BoundValue(-1,list[0].line,{
            lhs: lhs,
            cmp: ineqSeparators[i].value as '<',
            rhs: rhs
          },''));
        }
      }
      rawSplitBounds.push(iterBounds);
    }
    // console.log('RAW SPLIT',rawSplitBounds.map(e => e.map(e => e.preview)));
    const finalBounds: BoundValue[] = [];
    for (let i = 0; i < logicalSeparators.length; i++) {
      if (rawSplitBounds[i].length == 0) {
        return new CompilationError(ErrorName.Bound_MissingValue,undefined,undefined,'boundResolve empty raw split');
      }
      finalBounds.push(new BoundValue(-1,list[0].line,{
        lhs: rawSplitBounds[i].shift()!,
        cmp: logicalSeparators[i].value as 'xor',
        rhs: (rawSplitBounds[i+1].length == 1 && i != logicalSeparators.length - 1)
          ? rawSplitBounds[i+1][0] : rawSplitBounds[i+1].pop()!
      },''));
    }
    for (const list of rawSplitBounds) {
      finalBounds.push(...list);
    }
    return finalBounds;
  }

  private saveAsWTF(symbol: AbstractSymbol | undefined,line?: CodeLine): void {
    if (symbol != undefined && !(symbol.name == undefined && typeof symbol.value != 'string')) {
      this.symbolGraph.addVertex((symbol.name ?? symbol.value as string));
      this.symbolMap.set(
        (symbol.name ?? symbol.value as string),
        new WhatTheFuck(-1,line ?? symbol.line,symbol.text,symbol.name ?? symbol.value as string)
      );
    }
  }
  private saveSymbol(symbol: AbstractSymbol | undefined,line: CodeLine): CompilationError | undefined {
    if (symbol?.name == 'all_vars') {
      return;
    }
    console.log('%cattempting save','color:orange',symbol?.toString());
    if (symbol == undefined || !(symbol instanceof StorableSymbol) || symbol.name == undefined || !Interpreter.isValidSymbol(symbol.name,true)) {
      this.saveAsWTF(symbol);
      return new CompilationError(ErrorName.IllegalExpression,symbol,symbol,'saveSymbol type check');
    }
    if (Interpreter.bannedSymbolNames.has(symbol.name)) {
      this.saveAsWTF(symbol);
      return new CompilationError(ErrorName.IllegalSymbolName,symbol,symbol,'check for banned name');
    }
    const saved = this.inferImportedSymbol(symbol.name,line) ?? this.symbolMap.get(symbol.name);
    if (saved) { //already exists
      if (saved instanceof Variable) { //add fallback for line
        saved.addFallback(symbol.line);
      } else if (symbol.line != saved.line) { //already declared on another line
        console.log('%cduplicate declaration','color:orange',symbol.name);
        return new CompilationError(ErrorName.DuplicateDeclarations,symbol,symbol,'save symbol');
      } else { //resave value from same line
        console.log('%creplacing value on same line','color:orange',symbol.name);
        this.symbolGraph.addVertex(symbol.name);
        this.symbolMap.set(symbol.name,symbol);
      }
    } else { //does not exist
      console.log('%csaving value','color:orange',symbol.name);
      this.symbolGraph.addVertex(symbol.name);
      this.symbolMap.set(symbol.name,symbol);
    }
    return undefined;
  }
  private getSymbolsDeclaredOnLine(line: CodeLine): Set<AbstractStorable> {
    const symbolSet: Set<AbstractStorable> = new Set();
    for (const symbol of this.symbolMap.values()) {
      if (symbol.line == line) {
        symbolSet.add(symbol);
      }
    }
    return symbolSet;
  }
  private getSymbolsDeclaredOnLineAsDict(line: CodeLine): Readonly<Record<string,AbstractStorable>> {
    const record: Record<string,AbstractStorable> = {};
    for (const sym of this.getSymbolsDeclaredOnLine(line)) {
      record[sym.name!] = sym;
    }
    return record;
  }
  private deleteSymbolsFromLine(line: CodeLine): void {
    for (const sym of this.getSymbolsDeclaredOnLine(line)) {
      console.log(`%cdeleting symbol ${sym.name} on line ` + (line.index+1),'color:turquoise');
      if (sym instanceof VariableVector) {
        for (const v of sym.value) {
          v.removeFallback(sym);
          if (!v.isDefined) {
            this.symbolMap.delete(v.name!);
          }
        }
      }
      if (sym instanceof AppendableValue) {
        sym.removeValuesFromLine(line);
      }
      sym.delete();
      this.symbolMap.delete(sym.name!);
    }
  }
  private inferImportedSymbol(text: string,line: CodeLine): AbstractStorable | undefined {
    // console.log('infer import',Array.from(Interpreter.importedSymbolMap.keys()),text);
    const importedSymbol = Interpreter.importedSymbolMap.get(text);
    if (importedSymbol == undefined) {
      // console.log('not found');
      return undefined;
    }
    const importLine = this.importLocationMap.get(text);
    if (importLine == undefined || importLine.index > line.index) {
      // console.log('too late','importer on',importLine?.index,'pulling from',line.index);
      return undefined;
    }
    return importedSymbol;
  }
  private inferResolveable(text: string,index: number,line: CodeLine,prevString: string | undefined): AbstractSymbol | AbstractSymbol[] { 
    if (text == 'all_vars') {
      const variables: Variable[] = [];
      for (const symbol of this.symbolMap.values()) {
        if (symbol instanceof Variable && symbol.line.index <= line.index) {
          variables.push(symbol);
        }
      }
      return new VariableVector(index,line,variables,'all_vars','all_vars');
    }
    function removeStartingNumbers(inputString: string): [string,string] {
      const regex = /^(0|[1-9]\d*)/;
      const match = inputString.match(regex);
      if (match) {
        const removedNumbers = match[0];
        const stringWithoutNumbers = inputString.slice(removedNumbers.length);
        return [removedNumbers,stringWithoutNumbers];
      } else {
        return ['',inputString];
      }
    }
    if (text == Piping.shortcut) {
      return new Piping(index,line);
    } else if (text == Spread.shortcut) {
      return new Spread(index,line);
    } else if (text == Append.shortcut) {
      return new Append(index,line);
    } else if (Interpreter.groupings.includes(text)) {
      return new GroupingSymbol(index,line,text as '('|')'|'{'|'}'|'['|']');
    } else if (text == '=>' || text == '<=>') {
      return new IfThen(index,line,text);
    }
    // else if (Interpreter.optimizers.includes(text)) {
    //   return new Optimizer(index,line,text as 'max');
    // }
    else if (Interpreter.operators.includes(text)) {
      return Operator.Build(index,line,text);
    } else if (Interpreter.ambiguous.includes(text as StorableSymbolType)) {
      if (index == 0 || prevString == 'can' || prevString == 'is') {
        return new BasicSymbol(index,line,text,'declaration');
      } else {
        return BuiltInFunction.Build(index,line,text);
      }
    } else if (Interpreter.functions.includes(text)) {
      return BuiltInFunction.Build(index,line,text);
    } else if (Interpreter.macros.includes(text)) {
      return Macro.Build(index,line,text);
    } else if (Interpreter.keywords.includes(text) || Interpreter.predicates.includes(text)) {
      return new BasicSymbol(index,line,text,'keyword');
    } else if (Interpreter.declarations.includes(text as StorableSymbolType)) {
      return new BasicSymbol(index,line,text,'declaration');
    } else if (Interpreter.domains.includes(text)) {
      return new BasicSymbol(index,line,text,'domain');
    } else if (text == 'none') {
      return new NoneType(index,line,text);
    } else if (text.length > 0 && !isNaN(Number(text.replace(/_/g,'')))) {
      return new NumberValue(index,line,Number(text.replace(/_/g,'')),text);
    } else if (this.inferImportedSymbol(text,line) || this.symbolMap.has(text)) {
      const storedValue = this.inferImportedSymbol(text,line) ?? this.symbolMap.get(text)!;
      if (storedValue.line.index >= line.index) {
        return new ProxySymbol(index,line,text);
      }
      const clonedValue = storedValue instanceof AppendableValue ? storedValue.clone(index,undefined,line) : storedValue.clone(index);
      // const clonedValue = storedValue instanceof AppendableValue ? storedValue : storedValue.clone(index);
      if (storedValue.displayAsAny && clonedValue instanceof StorableSymbol) {
        clonedValue.displayAsAny = true;
      }
      return clonedValue;
    } else if (text.charAt(0) == '@' && Interpreter.isValidSymbol(text.substring(1))) {
      return new NameSymbol(index,line,text);
    }
    const parts = removeStartingNumbers(text);
    if (parts[0].length > 0) { //coefficient of value
      const C = new NumberValue(index,line,Number(parts[0]),parts[0]);
      if (this.symbolMap.has(parts[1]) && this.symbolMap.get(parts[1])!.line != line) { //make sure symbol originated from another line
        return [C,this.symbolMap.get(parts[1])!.clone(index + 0.5)];
      } else {
        return [C,new ProxySymbol(index+0.5,line,parts[1])];
      }
    }
    return new ProxySymbol(index,line,text);
  }

  private updateSyntax(focusLine: CodeLine,ev?: KeyboardEvent,replace?: IReplaceEnd,fromPropagation: boolean = false): boolean {
    if ((this.isPropagating || this.actionBuffer.length > 0) && !fromPropagation) {
      this.actionBuffer.push({line:focusLine,ev});
      return false;
    }
    // console.log('SYNTAXING',focusLine.index);
    // console.time('updateSyntax');
    // ~ GET CARET POSITION ~
    
    let content = focusLine.text.replace(/\u001a/g,'').replace(/\u001e/,'');
    const symbolInitialValues = this.getSymbolsDeclaredOnLineAsDict(focusLine);
    let {start:startIndex,end:endIndex} = focusLine.caretPosition;

    // ~ USER TYPED SOMETHING ~

    if (ev && ev.key != 'Shift') {
      // const pos = focusLine.caretPosition;
      // startIndex = pos.start;
      // endIndex = pos.end;
      const lookup: Readonly<Record<string,string>> = {
        '"': '"',
        '(': ')',
        '[': ']',
        '{': '}'
      }
      if (ev.key == 'Backspace') {
        if (startIndex == endIndex) {
          const deleteChar = content.charAt(startIndex - 1);
          content = content.slice(0,startIndex - 1) + content.slice(endIndex);
          startIndex--;
          endIndex--;

          const nextChar = content.charAt(startIndex);
          const prevChar = content.charAt(startIndex-1);
          if (deleteChar == '"' && prevChar == '\\') {
            content = content.slice(0,startIndex - 1) + content.slice(endIndex);
            startIndex--;
            endIndex--;
          } else if ((deleteChar == '(' && nextChar == ')') || (deleteChar == '[' && nextChar == ']') || (deleteChar == '{' && nextChar == '}') || (deleteChar == '"' && nextChar == '"')) {
            content = content.slice(0,startIndex) + content.slice(endIndex + 1);
          }
        } else {
          content = content.slice(0,startIndex) + content.slice(endIndex);
          endIndex = startIndex;
        }
      } else {
        if (startIndex != endIndex && keys(lookup).includes(ev.key)) { //type symbols around selected text
          const startingLetter = ev.key;
          const endingLetter = lookup[ev.key];
          content = content.slice(0,startIndex) + startingLetter + content.slice(startIndex,endIndex) + endingLetter + content.slice(endIndex);
          startIndex++;
          endIndex++;
        } else {
          // console.log(startIndex == endIndex,keys(lookup).includes(content.charAt(startIndex-1)),values(lookup).includes(ev.key));
          if (!(startIndex == endIndex && keys(lookup).includes(content.charAt(startIndex-1)) && content.charAt(startIndex-1)==this.lastKeyStroke?.ev.key && this.lastKeyStroke?.line == focusLine && values(lookup).includes(ev.key))) {
            const negativeLookbehindSupported = /(?<!\\)/.test('');
            const regexPattern = negativeLookbehindSupported?/(?<!\\)"/g:/[^\\]"/g;
            const matchCount = (content.match(regexPattern) ?? []).length;
            content = content.slice(0,startIndex) + (ev.key=='Tab'?'\u00a0\u00a0':ev.key) +
              (ev.key=='('?')':'') + (ev.key=='['?']':'') + (ev.key=='{'?'}':'') + (ev.key=='"'&&content.charAt(startIndex-1)!='\\'&&matchCount%2==0?'"':'') + content.slice(endIndex);
          }
          startIndex++;
          endIndex = startIndex;
        }
      }
      this.lastKeyStroke = {line:focusLine,ev:ev};
    } else if (replace && startIndex == endIndex) {
      this.lastKeyStroke = undefined;
      let floatingIndex = startIndex;
      while (floatingIndex > 0) {
        if (content.slice(floatingIndex).includes(replace.match)) {
          break;
        }
        floatingIndex--;
      }
      content = content.slice(0,floatingIndex) + replace.substitute + content.slice(floatingIndex+replace.match.length);
      startIndex = floatingIndex + replace.substitute.length;
      endIndex = startIndex;
    } else {
      this.lastKeyStroke = undefined;
    }
    if (startIndex == endIndex) {
      for (const key in Interpreter.symbolLookup) {
        if (content.includes(key)) {
          content = content.replace(key,Interpreter.symbolLookup[key]);
          startIndex -= key.length - 1;
          endIndex -= key.length - 1;
        }
      }
    }

    // ~ EXTRACT TYPED STRINGS ~
    
    const initStartOfComment = content.indexOf('#')==-1?content.length:content.indexOf('#');
    const repStr = new ReplaceableString(Interpreter.escape(content));
    let indexOfOpeningQuote: number | undefined;
    const pulled: string[] = [];
    for (let i = 0; i < initStartOfComment; i++) {
      if (content[i] == '"' && content[i-1] != '\\') {
        if (indexOfOpeningQuote == undefined) {
          indexOfOpeningQuote = i;
        } else {
          pulled.push(content.slice(indexOfOpeningQuote,i+1));
          content = content.slice(0,indexOfOpeningQuote) + '\u001a' + content.slice(i+1);
          i -= (i - indexOfOpeningQuote) + 2;
          indexOfOpeningQuote = undefined;
        }
      }
    }
    
    // ~ SPLIT INTO COMMANDS ~
    
    const startOfComment = content.indexOf('#')==-1?content.length:content.indexOf('#');
    const hasSTFU = content.substring(0,startOfComment).includes('stfu');
    const startOfSTFU = hasSTFU?content.indexOf('stfu'):content.length;
    const commandList: AbstractSymbol[] = content.slice(0,Math.min(startOfComment,startOfSTFU))
      .replace(/\u00a0/g,' ')
      .replace(/(?<!e)\+/gi,' + ').replace(/(?<!e)\-/gi,' - ')
      .replace(/\*/g,' * ')
      // .replace(/\//g,' / ')
      .replace(/([^/])\//g,'$1 /').replace(/([/])(?![/])/g,'$1 ')
      .replace(/\(/g,' ( ').replace(/\)/g,' ) ')
      .replace(/\[/g,' [ ').replace(/\]/g,' ] ')
      .replace(/\{/g,' { ').replace(/\}/g,' } ')
      .replace(/\,/g,' , ').replace(/\#/g,' # ').replace(/\:/g,' : ').replace(/@\s*/g, ' @')
      // .replace(/(?<=\D)\.(?=\D)|(?<=\d)\.(?=\D)|(?<=\D)\.(?=\d)/g,' . ')
      .replace(/\.\.\./g,'\u001e')
      .replace(/(?<=\D)\.(?=\D)|(?<=\d)\.(?=\D)|(?<=\D)\.(?=\d)|(?<=\D)\.$/g,' . ')
      .replace(/\u001e/g,' ... ')
      
      .replace(/([^<>~=])=/g,'$1 =').replace(/~/g,' ~')
      .replace(/</g,' <').replace(/([^<])\|/g,'$1 |').replace(/([^\|=])>/g,'$1 >')
      .replace(/([>~])(?![=])/g,'$1 ').replace(/([=])(?![>=])/g,'$1 ')
      .replace(/([<])(?![\|=])/g,'$1 ').replace(/([\|])(?![>])/g,'$1 ')

      .replace(/\!/g,' ! ').replace(/\^/g,' ^ ').replace(/\?/g,' ? ').replace(/'/g," ' ")
      .replace(/([^\\])"/g, '$1 "').replace(/\\/g,' \\').replace(/"/g,'" ')
      .replace(/\%/g,' % ').replace(/&/g,' & ')
      .replace(/\s\s+/g,' ')
      .trim().split(' ').map((e,i,v) => {
        if (e == '\u001a') {
          const pulledString = pulled.shift();
          if (pulledString) {
            return new StringValue(i,focusLine,pulledString.slice(1,-1).replace(/\s\s+/g,' '),pulledString);
          } else {
            return new ProxySymbol(-1,focusLine,'');
          }
        } else if (e.length == 0) {
          return [];
        }
        return this.inferResolveable(e,i,focusLine,v[i-1]);
      }).flat();
    console.log(`%cRAW ${commandList.map(e => e.toString())}`,'color:magenta');
    const commentRaw = content.slice(startOfComment);

    // ~ DETERMINE CARET INDEX ~

    let caretIndex = -1;
    if (startIndex == endIndex) {
      if (startIndex == content.length) {
        caretIndex = commandList.length - 1;
      } else {
        let searchContent = content.slice();
        let poppedContent = '';
        for (let i = 0; i < commandList.length; i++) {
          if (commandList[i].text.length == 0) {
            continue;
          }
          const findIndex = searchContent.indexOf(commandList[i].text) + poppedContent.length;
          if (startIndex >= findIndex && startIndex < findIndex + commandList[i].text.length) {
            caretIndex = i;
            break;
          }
          poppedContent += searchContent.slice(0,commandList[i].text.length);
          searchContent = searchContent.slice(commandList[i].text.length);
        }
      }
    }

    // ~ CHECK FOR EXCESS INTERMEDIATE TOKENS ~

    let error: CompilationError | undefined;
    const warningList: CompilationWarning[] = [];
    const recommendationList: CompilationRecommendation[] = [];
    if (content.slice(startOfSTFU+4,startOfComment).replace(/ /g,'').replace(/\u00a0/g,'').length > 0) {
      error ??= new CompilationError(ErrorName.IllegalExpression,undefined,content.slice(startOfSTFU,startOfComment),'stfu excess');
    }
    
    // ~ DETERMINE OPERATOR PRIORITY ~
    
    let parenLevel = 0;
    let braceLevel = 0;
    let bracketLevel = 0;
    let groupingLevel = 0;
    let quoteLevel = 0;
    for (let i = 1; i < commandList.length; i++) { //find unary "+" and "-"
      if (commandList[i] instanceof Addition && (commandList[i-1] instanceof Operator || (commandList[i-1] instanceof GroupingSymbol && (commandList[i-1] as AbstractGroupingSymbol).opening) || commandList[i-1].value == '=')) {
        (commandList[i] as Addition<'+'>).priority = OperatorPriority.UnaryAddition;
      }
    }
    for (const command of commandList) { //update levels of operators and groupings
      if (command instanceof GroupingSymbol) {
        if (command.opening) {
          groupingLevel++;
        } else {
          groupingLevel--;
        }
      }
      if (command.value == '[') {
        bracketLevel++;
      } else if (command.value == ']') {
        bracketLevel--;
      } else if (command.value == '{') {
        braceLevel++;
      } else if (command.value == '}') {
        braceLevel--;
      } else if (command.value == '(') {
        parenLevel++;
      } else if (command.value == ')') {
        parenLevel--;
      } else if (command.value == '"') {
        quoteLevel = 1 - quoteLevel;
      }
      if (command instanceof Operator && !(command instanceof Comma)) { //NOTE: apply any changed to * injection in singleResolve
        command.priority += (MAX_OPERATOR_PRIORITY + 1) * groupingLevel;
      } else if (command instanceof GroupingSymbol) {
        if (command.value == '(' || command.value == ')') {
          command.level = groupingLevel + (command.closing?1:0);
        } else if (command.value == '[' || command.value == ']') {
          command.level = groupingLevel + (command.closing?1:0);
        } else if (command.value == '{' || command.value == '}') {
          command.level = groupingLevel + (command.closing?1:0);
        } else if (command instanceof Piping) {
          command.level = groupingLevel;
        }
      }
      if (braceLevel > 1) {
        error ??= new CompilationError(ErrorName.ExcessiveBraces,commandList,undefined,'counting');
      }
    }
    if (parenLevel != 0) {
      error ??= new CompilationError(ErrorName.MismatchedParentheses,commandList,undefined,'counting');
    } else if (braceLevel != 0) {
      error ??= new CompilationError(ErrorName.MismatchedBraces,commandList,undefined,'counting');
    } else if (bracketLevel != 0) {
      error ??= new CompilationError(ErrorName.MismatchedBrackets,commandList,undefined,'counting');
    } else if (quoteLevel != 0) {
      error ??= new CompilationError(ErrorName.MismatchedQuotes,commandList,undefined,'counting');
    }
    const faIndexes = commandList.map((e,i) => e.value=='fa'?i:-1).filter(e => e!=-1);
    const foIndexes = commandList.map((e,i) => e.value=='fo'?i:-1).filter(e => e!=-1);
    if (faIndexes.length != foIndexes.length) {
      error ??= new CompilationError(ErrorName.FAFO_UnequalNumber,commandList,commandList,'fafo count check');
    } else {
      for (let i = 0; i < faIndexes.length; i++) {
        if (foIndexes[i] < faIndexes[i]) {
          const fafo = [commandList[faIndexes[i]],commandList[foIndexes[i]]];
          error ??= new CompilationError(ErrorName.FAFO_OutOfOrder,fafo,fafo,'fafo order check');
        }
      }
    }

    // console.log(`%cRARE ${commandList.map(e => e.toString())}`,'color:magenta');
  
    this.deleteSymbolsFromLine(focusLine);
    // const optimizeLineArchive = this.opimizerLine;
    // if (this.opimizerLine == focusLine) {
    //   this.optimizingAlias = undefined;
    //   this.opimizerLine = undefined;
    //   this.optimizingMode = undefined;
    // }
    // for (const constraint of this.constraintSet) { //remove all constraints on this line
    //   if (constraint.line == focusLine) {
    //     this.constraintSet.delete(constraint);
    //   }
    // }

    const output = this.isRunning?new OutputLine(focusLine):undefined;
    if (error == undefined && commandList.some(e => e.text.length > 0)) {
      error = this.parseSyntax(commandList,warningList,recommendationList,focusLine,output);
    }
    if (output && output.hasContent) {
      output.appendTo(this.output);
    }
    if (error) {
      this.isRunning = false;
    }

    // ~ UPDATE GRAPH AND CHECK FOR CYCLES ~

    let hasCircularDependency = false;
    if (commandList[0]?.type == 'declaration' && commandList[1] && (commandList[0].value == 'var' || commandList[2]?.value == '=')) { //new symbol declared
      const attemptedName = commandList[1].name ?? commandList[1].value;
      if (typeof attemptedName == 'string') {
        this.symbolGraph.deleteEdgesToVertex(attemptedName);
        for (let i = 2; i < commandList.length; i++) {
          if (commandList[i].name) {
            this.symbolGraph.addEdge(commandList[i].name!,attemptedName);
          }
        }
      }
      const cycle = this.symbolGraph.findCycle();
      if (cycle) {
        hasCircularDependency = true;
        error ??= new CompilationError(ErrorName.CircularDependency,commandList[1],'"' + cycle.join('"->"') + `"->"${commandList[1].name}"`,'cycle check graph');
      }
    }

    // ~ PRINT WARNINGS AND ERROR? TO CONSOLE ~

    error?.print();
    for (const warning of warningList) {
      warning.print();
    }

    // ~ REPLACE INNERHTML ~

    const groupedCommandList: AbstractSymbol[][] = [];
    let currentLevel = -1;
    for (const sym of commandList) { //split into groups based on messages
      if (sym.text.length == 0) {
        continue;
      }
      if (sym.messageLevel != currentLevel) {
        groupedCommandList.push([sym]);
        currentLevel = sym.messageLevel;
      } else {
        groupedCommandList[groupedCommandList.length-1].push(sym);
      }
    }
    for (const group of groupedCommandList) { //add spans for wavy underline and color words
      if (group.length == 0) {
        continue;
      }
      let messageLevel = group[0].messageLevel;
      if (messageLevel == MessageLevel.Warning && (hasSTFU || this.suppressWarnings)) {
        messageLevel = MessageLevel.None;
      }
      if (messageLevel == MessageLevel.Recommendation && (hasSTFU || this.suppressRecommendations)) {
        messageLevel = MessageLevel.None;
      }
      if (messageLevel == MessageLevel.Recommendation) {
        repStr.movePastSpaces();
        repStr.replace('','<span class="recommendation">');
      } else if (messageLevel == MessageLevel.Warning) {
        repStr.movePastSpaces();
        repStr.replace('','<span class="warning">');
      } else if (messageLevel == MessageLevel.Error) {
        repStr.movePastSpaces();
        repStr.replace('','<span class="error">');
      }
      for (const item of group) {
        if (item.index == -1) {
          continue;
        }
        if ((item instanceof StorableSymbol || item instanceof BuiltInFunction || item instanceof Macro) && !item.displayAsProxy) {
          if (item instanceof StringValue) {
            if (item.isHex) {
              const color = item.colorData!;
              repStr.replace(
                Interpreter.escape(item.text),
                `<span title="${item.preview.replace(/"/g,'&quot;')}" class="${item.markers.join(' ')}">&quot;<span style="background-color:${color.hex};color:${color.text}">${Interpreter.escape(item.value)}</span>&quot;</span>`
              );
            } else {
              // repStr.replace(Interpreter.escape(item.text),`<span title="${item.preview.replace(/"/g,'&quot;')}" class="${item.markers.join(' ')}">${Interpreter.escape(item.text).replace(/&bsol;"/g,'<span class="escaped">&bsol;"</span>')}</span>`);
              repStr.replace(Interpreter.escape(item.text),`<span title="${item.preview.replace(/"/g,'&quot;')}" class="${item.markers.join(' ')}">${Interpreter.clean(item.text)}</span>`);
            }
          } else {
            repStr.replace(Interpreter.escape(item.text),`<span title="${item.preview.replace(/"/g,'&quot;')}" class="${item.markers.join(' ')}">${Interpreter.escape(item.text)}</span>`);
          }
        } else if (item.overridePreview) {
          repStr.replace(Interpreter.escape(item.text),`<span title="${item.overridePreview}" class="${item.markers.join(' ')}">${Interpreter.escape(item.text)}</span>`);
        } else {
          repStr.replace(Interpreter.escape(item.text),`<span class="${item.markers.join(' ')}">${Interpreter.escape(item.text)}</span>`);
        }
      }
      if (group[0].messageLevel > 0) {
        repStr.replace('','</span>');
      }
    }
    if (hasSTFU) {
      repStr.replace('stfu','<span class="keyword">stfu</span>');
    }
    if (commentRaw.length > 0) {
      repStr.replace(Interpreter.escape(commentRaw),`<span class="comment">${Interpreter.escape(commentRaw)}</span>`);
    }
    focusLine.html = repStr.toString(true);

    // ~ DISPLAY MESSAGES ~
    
    focusLine.clearMessages();
    focusLine.updateMessages([
      ...(error?[error]:[]),
      ...((hasSTFU||this.suppressWarnings)?[]:warningList),
      ...((hasSTFU||this.suppressRecommendations)?[]:recommendationList)
    ]);

    this.messageMap.set(focusLine,{
      error: error,
      warning: warningList.length==0?undefined:warningList,
      recommendations: recommendationList.length==0?undefined:recommendationList
    });
    if (commandList[0]?.value == 'assert') {
      const symbolNames: string[] = [];
      for (const command of commandList) {
        if (command.name) {
          symbolNames.push(command.name);
        }
      }
      this.assertionMap.set(focusLine,symbolNames);
    } else {
      this.assertionMap.delete(focusLine);
    }

    // ~ UPDATE CARET AND ADD AUTOCOMPLETE ~

    if (focusLine.isActive) {
      focusLine.caretPosition = {start:startIndex,end:endIndex};
    }
    const dottableA = commandList[caretIndex-1] instanceof KeyableSymbol && commandList[caretIndex]?.value == '.';
    const dottableB = commandList[caretIndex-2] instanceof KeyableSymbol && commandList[caretIndex-1]?.value == '.' && !commandList[caretIndex]?.displayAsIndex;
    const typingStorable = !(commandList[caretIndex] instanceof StorableSymbol) && commandList[caretIndex]?.text.length >= 2 && !(commandList[0]?.type == 'declaration' && caretIndex < 3);
    if (caretIndex == 0) {
      const rect = focusLine.getBoundingDictOfNthChild(caretIndex);
      if (rect) {
        const keywordOptions: IPropertyOption[] = [];
        for (const keyword of Interpreter.declarations) {
          keywordOptions.push({name:keyword,type:'declaration',value:''});
        }
        for (const keyword of Interpreter.ambiguous) {
          keywordOptions.push({name:keyword,type:'declaration',value:''});
        }
        const unlinked = CodeLine.Unlinked();
        for (const keyword of Interpreter.macros) {
          const dir = Macro.Build(-1,unlinked,keyword);
          keywordOptions.push({name:keyword,type:'macro',value:dir instanceof Macro?dir.signature:''});
        }
        this.showAutoComplete(commandList[0].text,keywordOptions,rect);
      }
    } else if ((dottableA || dottableB) && startIndex == endIndex) {
      const keyable = (dottableA?commandList[caretIndex-1]:commandList[caretIndex-2]) as AbstractKeyable;
      const rect = focusLine.getBoundingDictOfNthChild(caretIndex);
      if (keyable.options && rect) {
        const match = dottableA?'':commandList[caretIndex].text;
        this.showAutoComplete(match,keyable.options,rect);
      }
    } else if (typingStorable) {
      const rect = focusLine.getBoundingDictOfNthChild(caretIndex);
      if (rect) {
        const options: IPropertyOption[] = [];
        for (const [name,storable] of this.symbolMap.entries()) {
          if (storable.line.index < focusLine.index) {
            options.push({
              name: name,
              type: storable.type,
              value: (storable instanceof BuiltInFunction) ? storable.signature : storable.preview
            });
          }
        }
        const unlinked = CodeLine.Unlinked();
        for (const fxnName of Interpreter.functions) {
          const fxn = BuiltInFunction.Build(-1,unlinked,fxnName);
          if (fxn instanceof BuiltInFunction) {
            options.push({name:fxnName,type:'func',value:fxn.signature});
          }
        }
        if (commandList[caretIndex-1]?.text != 'is' && commandList[caretIndex-1]?.text != 'can') {
          for (const fxnName of Interpreter.ambiguous) {
            const fxn = BuiltInFunction.Build(-1,unlinked,fxnName);
            if (fxn instanceof BuiltInFunction) {
              options.push({name:fxnName,type:'func',value:fxn.signature});
            }
          }
        }
        this.showAutoComplete(commandList[caretIndex].text,options,rect);
      }
    }

    // ~ PROPOGATE ~

    let wasValueUpdated = false;
    const symbolFinalValues = this.getSymbolsDeclaredOnLineAsDict(focusLine);
    for (const name in symbolInitialValues) {
      if (!(name in symbolFinalValues)) {
        wasValueUpdated = true;
        this.symbolGraph.deleteEdgesToVertex(name);
      } else if (!symbolInitialValues[name].equals(symbolFinalValues[name])) {
        wasValueUpdated = true;
      }
    }
    if (!wasValueUpdated) {
      for (const name in symbolFinalValues) {
        if (!(name in symbolInitialValues)) {
          wasValueUpdated = true;
          break;
        }
      }
    }
    this.lastTypedLine = focusLine;
    if (ev && !this.isPropagating && !this.isRebuilding) { //set timeout for propogation
      if (this.lastTypedLine != undefined && this.lastTypedLine != focusLine) { //propogate changes from previous line
        clearTimeout(this.propogateTimeout);
        if (!hasCircularDependency) {
          this.propagateChanges(this.lastTypedLine);
        }
      }
      clearTimeout(this.propogateTimeout);
      if (this.delayCount < Interpreter.maxDelayCount) {
        this.delayCount++;
        this.propogateTimeout = window.setTimeout(() => this.propagateChanges(focusLine),Interpreter.propgateDelayInMS);
      } else {
        this.delayCount = 0;
        if (!hasCircularDependency) {
          this.propagateChanges(focusLine);
        }
      }
    }

    // console.timeEnd('updateSyntax');
    return wasValueUpdated;
  }
  private replaceSyntax(row: Element | null): void {
    const substitute = row?.getAttribute('data-substitute');
    const match = row?.closest('table')?.getAttribute('data-match');
    if (substitute == null || match == null || !this.lastTypedLine) {
      return;
    }
    Interpreter.autocompleteTable?.remove();
    Interpreter.autocompleteTable = undefined;
    this.updateSyntax(this.lastTypedLine,undefined,{match:match,substitute:substitute});
  }
  private propagateChanges(focusLine: CodeLine): void {
    if (this.isRunning) {
      return;
    }
    let oshlop = 0;
    const MAX_OSHLOP = 15;
    this.isPropagating = true;
    const lineQueue = new OrderedQueue<CodeLine>();
    const symbolGraph = this.symbolGraph.clone();
    for (const sym of this.getSymbolsDeclaredOnLine(focusLine)) {
      if (symbolGraph.hasVertex(sym.name!)) {
        for (const neighbor of symbolGraph.getNeighbors(sym.name!)!) {
          lineQueue.enqueue(this.symbolMap.get(neighbor)!.line);
        }
      }
    }
    // console.log(symbolGraph);
    while (!lineQueue.isEmpty && oshlop++ < MAX_OSHLOP) {
      const iterLine = lineQueue.dequeue()!;
      const wereValuesChanged = this.updateSyntax(iterLine,undefined,undefined,true);
      const symbolsOnLine = this.getSymbolsDeclaredOnLine(iterLine);
      if (wereValuesChanged) {
        // console.log('values changed on line',iterLine.index);
        for (const sym of symbolsOnLine) {
          for (const neighbor of symbolGraph.getNeighbors(sym.name!)!) {
            // console.log('queueing line',this.symbolMap.get(neighbor)!.line.index);
            lineQueue.enqueue(this.symbolMap.get(neighbor)!.line);
          }
        }
      } else {
        // console.log('no values changed, nuking from',iterLine.index);
        for (const sym of symbolsOnLine) {
          symbolGraph.deleteVertex(sym.name!);
        }
      }
    }
    if (oshlop >= MAX_OSHLOP - 1) {
      throw 'wtf';
    }
    while (this.actionBuffer.length > 0) {
      const action = this.actionBuffer.shift()!;
      this.updateSyntax(action.line,action.ev,undefined,true);
    }
    this.isPropagating = false;
  }
  private rebuild(): void {
    this.isRebuilding = true;
    for (const line of this.lineList) {
      this.updateSyntax(line);
    }
    this.isRebuilding = false;
  }
  private showAutoComplete(match: string,options: IPropertyOption[],rect: DOMRect): void {
    if (options.length == 0) {
      return;
    }
    Interpreter.autocompleteTable?.remove();
    const propOptions = options.map(e => {
      const matrix = SuperString.levenshteinMatrix(match,e.name);
      return {
        ...e,
        high: SuperString.levenshteinHighlighting(match,e.name,matrix),
        path: SuperString.levenshteinPath(matrix,undefined),
        d0: SuperString.levenshteinCommon(matrix,undefined,0),
        d1: SuperString.levenshteinCommon(matrix,undefined,1),
        d2: SuperString.levenshteinCommon(matrix,undefined,2),
      };
    }).filter(e => (e.d1 <= 1 && match.length <= 2) || (e.d1 * 1.2 >= match.length));
    if (propOptions.length == 0) {
      return;
    }
    const table = document.createElement('table');

    if (match.length > 0) {
      propOptions.sort((a,b) => {
        if (a.d0 != b.d0) {
          return b.d0 - a.d0;
        }
        if (a.d1 != b.d1) {
          return b.d1 - a.d1;
        }
        if (a.d2 != b.d2) {
          return b.d2 - a.d2;
        }
        return a.name.length - b.name.length;
      });
    }
    table.id = 'auto-complete-table';
    table.setAttribute('data-match',match);
    for (let i = 0; i < Math.min(propOptions.length,6); i++) {
      const option = propOptions[i];
      const row = document.createElement('tr');
      row.setAttribute('data-substitute',option.name);
      if (i == 0) {
        row.classList.add('selected');
      }
      const typeCell = document.createElement('td');
      typeCell.textContent = '<' + option.type + '>';
      row.appendChild(typeCell);
      const nameCell = document.createElement('td');
      let nameHighlighting = `<span class="${option.type}">`;
      for (const dict of option.high) {
        nameHighlighting += dict.common?'<b>'+dict.char+'</b>':dict.char;
      }
      nameCell.innerHTML = nameHighlighting + '</span>';
      row.appendChild(nameCell);
      const valueCell = document.createElement('td');
      valueCell.textContent = option.value;
      row.appendChild(valueCell);
      row.onclick = () => this.replaceSyntax(row);
      table.appendChild(row);
    }
    if (propOptions.length > 6) {
      const valuesHidden = propOptions.length - 6;
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.setAttribute('colspan','3');
      cell.textContent = `${valuesHidden} option${valuesHidden==1?'':'s'} hidden`;
      row.appendChild(cell);
      table.appendChild(row);
    }
    table.style.left = (rect.left+rect.width) + 'px';
    if (rect.top > window.innerHeight * 0.75) {
      table.style.bottom = (window.innerHeight - rect.bottom + rect.height + 5) + 'px';
    } else {
      table.style.top = (rect.top+rect.height+5) + 'px';
    }
    Interpreter.autocompleteTable = table;
    document.body.appendChild(table);
  }
  private run(): void {
    const start = performance.now();
    this.isRunning = true;
    this.output.innerHTML = '';
    const animation = document.createElement('div');
    animation.classList.add('editor-running');
    animation.innerHTML = `
    <div class="loading-cont">
      <div style="transform:translateY(-1080%) rotate(0);background-color:var(--red)"></div>
      <div style="transform:rotate(-15deg) translateY(-1080%);background-color:var(--red)"></div>
      <div style="transform:rotate(-30deg) translateY(-1080%);background-color:var(--red)"></div>
      <div style="transform:rotate(-45deg) translateY(-1080%);background-color:var(--red)"></div>
      <div style="transform:rotate(-60deg) translateY(-1080%);background-color:var(--orange)"></div>
      <div style="transform:rotate(-75deg) translateY(-1080%);background-color:var(--orange)"></div>
      <div style="transform:rotate(-90deg) translateY(-1080%);background-color:var(--orange)"></div>
      <div style="transform:rotate(-105deg) translateY(-1080%);background-color:var(--orange)"></div>
      <div style="transform:rotate(-120deg) translateY(-1080%);background-color:var(--yellow)"></div>
      <div style="transform:rotate(-135deg) translateY(-1080%);background-color:var(--yellow)"></div>
      <div style="transform:rotate(-150deg) translateY(-1080%);background-color:var(--yellow)"></div>
      <div style="transform:rotate(-165deg) translateY(-1080%);background-color:var(--yellow)"></div>
      <div style="transform:rotate(-180deg) translateY(-1080%);background-color:var(--green)"></div>
      <div style="transform:rotate(-195deg) translateY(-1080%);background-color:var(--green)"></div>
      <div style="transform:rotate(-210deg) translateY(-1080%);background-color:var(--green)"></div>
      <div style="transform:rotate(-225deg) translateY(-1080%);background-color:var(--green)"></div>
      <div style="transform:rotate(-240deg) translateY(-1080%);background-color:var(--blue)"></div>
      <div style="transform:rotate(-255deg) translateY(-1080%);background-color:var(--blue)"></div>
      <div style="transform:rotate(-270deg) translateY(-1080%);background-color:var(--blue)"></div>
      <div style="transform:rotate(-285deg) translateY(-1080%);background-color:var(--blue)"></div>
      <div style="transform:rotate(-300deg) translateY(-1080%);background-color:var(--purple)"></div>
      <div style="transform:rotate(-315deg) translateY(-1080%);background-color:var(--purple)"></div>
      <div style="transform:rotate(-330deg) translateY(-1080%);background-color:var(--purple)"></div>
      <div style="transform:rotate(-345deg) translateY(-1080%);background-color:var(--purple)"></div>
      <div class="loading-circle">
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
        <div><div></div></div>
      </div>
    </div>
    `;
    this.editor.appendChild(animation);
    for (const line of this.lineList) {
      try {
        this.updateSyntax(line);
      } catch(e) {
        this.isRunning = false;
        const processOutput = new OutputLine('proc');
        processOutput.outputText(String(e),'error');
        processOutput.appendTo(this.output);
        break;
      }
      if (!this.isRunning) {
        const processOutput = new OutputLine('proc');
        processOutput.outputText('Process encountered a fatal error and was terminated','error');
        processOutput.appendTo(this.output);
        break;
      }
    }
    if (this.isRunning) { //no fatal error
      const duration = performance.now() - start;
      const processOutput = new OutputLine('proc');
      if (duration < 1000) {
        processOutput.outputText(`Program completed in ${duration.toFixed()}ms`);
      } else if (duration < 60_000) {
        processOutput.outputText(`Program completed in ${(duration/1000).toFixed(1)}s`);
      } else {
        processOutput.outputText(`Program completed in ${(duration/60_000).toFixed(1)}min`);
      }
      processOutput.appendTo(this.output);
    }
    animation.remove();
    this.isRunning = false;
  }

  private downloadAsQuinndo(fileName?: string): void {
    if (this.lineList.length == 0) {
      return;
    }
    const lines: string[] = [];
    for (const line of this.lineList) {
      lines.push(line.text);
    }
    Interpreter.download(JSON.stringify(this),(fileName ?? this.name) + '.qndo','text/json');
  }
  private renameFile(): void {

  }

  private importFrame(): void {
    this.isImporting = true;
    const fileInput = document.createElement('input');
    const allowedExtensions = ['.csv'];
    fileInput.type = 'file';
    fileInput.accept = allowedExtensions.join(',');
    fileInput.addEventListener('change',() => {
      const files = fileInput.files;
      if (files == null) {
        this.isImporting = false;
        return;
      }
      let fileFound = false;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (Interpreter.isValidFileExtension(file.name,allowedExtensions)) {
          this.importFrameCallback(file);
          fileFound = true;
          break;
        }
      }
      if (!fileFound) {
        this.isImporting = false;
      }
    });
    fileInput.click();
  }
  private async importFrameCallback(file: File): Promise<void> {
    Papa.parse(file,{
      skipEmptyLines: 'greedy',
      chunk: (result: IPapaResult) => new FrameImporter(result,(frame:AbstractStorable,report:(msg:string,type:MessageType)=>void) => this.importSymbol(frame,report))
    });
  }
  private importSymbol(frame: AbstractStorable,report: (msg:string,type:MessageType)=>void): void {
    if (frame.name == undefined || frame.name.length == 1) {
      report('This frame has an invalid name','error');
      return;
    }
    if (Interpreter.importedSymbolMap.has(frame.name)) {
      report('There is already an imported value with this name','error');
      return;
    }
    for (const line of this.lineList) {
      line.blur();
    }
    const importLine = new CodeLine(this.editor,0,this.lineList[0]);
    importLine.focus();
    // this.importLocationMap.set(frame.name,importLine);
    Interpreter.importedSymbolMap.set(frame.name,frame);
    this.lineList.unshift(importLine);
    this.updateLineNumbers();
    importLine.text = 'import ' + frame.name;
    this.updateSyntax(importLine);
    document.getElementById('frame-import-parent')?.classList.remove('visible');
    this.isImporting = false;
  }

  public toJSON(): IQUINNDOFile {
    const lines: (ILineMessage & {text:string,lineNumber:number})[] = [];
    for (const line of this.lineList) {
      lines.push({text:line.text,lineNumber:line.index,...this.messageMap.get(line)!});
    }
    return {
      version: Interpreter.version,
      fileName: this.name,
      suppress: {
        warnings: this.suppressWarnings,
        recommendations: this.suppressRecommendations
      },
      lines: lines,
    };
  }
}

window.onload = Interpreter.Init;

//check before .replace(/([^<>~=])=/g,'$1 =')
//following    .replace(/([>~=])(?![=])/g,'$1 ')


// 'a=b==c~=d<=e>=f~g>h<i|>j|k<|l=>m<=>n===o~==p'
// .replace(/([^<>~=])=/g,'$1 =').replace(/~/g,' ~')
// .replace(/</g,' <').replace(/([^<])\|/g,'$1 |').replace(/([^\|=])>/g,'$1 >')
// .replace(/([>~])(?![=])/g,'$1 ').replace(/([=])(?![>=])/g,'$1 ').replace(/([<])(?![\|=])/g,'$1 ')
// .replace(/([\|])(?![>])/g,'$1 ')


// 'a=b==c~=d<=e>=f~g>h<i|>j|k<|l=>m<=>n'.replace(/([^<>~=])=/g,'$1 =').replace(/([>~=])(?![=])/g,'$1 ').replace(/([<])(?![=|])/g,'< ').replace(/~/g,' ~').replace(/</g,' <').replace(/(\|)(?![>])/g,'| ').replace(/([^<])\|/g,'$1 |').replace(/([^|])>/g,'$1 >')
// == 'a = b == c ~= d <= e >= f ~ g > h < i |> j | k <| l';
// `Some"quoted"text\\"not quoted\\"more"text"`.replace(/([^\\])"/g, '$1 "').replace(/\\/g,' \\').replace(/"/g,'" ');
// 'a.b...c.'.replace(/([^.])(\.{1,3}|\.)([^.])/g, "$1 $2 $3").replace(/(?<!\.)\.$/,' .');

//any value in ?: function assignment
//color value
//typing tab
//evec coloring
//"01 jan 2024 12:00a"  
//matching braces
//01 01 1990 (excel)
//convert(5/2 m/s,mph)
//(5m / 2s) |> convert
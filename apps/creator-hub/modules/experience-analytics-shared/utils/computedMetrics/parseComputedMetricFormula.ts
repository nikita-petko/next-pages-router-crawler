export type BinaryOperator = '+' | '-' | '*' | '/' | '^';

const formulaFunctionDefinitions = {
  log: {
    minArgs: 1,
    maxArgs: 2,
    missingArgsError: 'log() requires one or two arguments',
    tooManyArgsError: 'log() supports one or two arguments',
  },
} as const;

export type FormulaFunctionName = keyof typeof formulaFunctionDefinitions;

export type FormulaAstNode =
  | { type: 'identifier'; name: string }
  | { type: 'number'; value: number }
  | { type: 'binary'; operator: BinaryOperator; left: FormulaAstNode; right: FormulaAstNode }
  | {
      type: 'function';
      name: FormulaFunctionName;
      args: [FormulaAstNode] | [FormulaAstNode, FormulaAstNode];
    };

type FormulaToken =
  | { type: 'identifier'; value: string }
  | { type: 'number'; value: number }
  | { type: 'operator'; value: BinaryOperator }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' };

type FormulaParseSuccess = {
  ok: true;
  ast: FormulaAstNode;
  identifiers: string[];
};

type FormulaParseFailure = {
  ok: false;
  errors: string[];
};

export type FormulaParseResult = FormulaParseSuccess | FormulaParseFailure;
export const COMPUTED_METRIC_VARIABLE_KEYS = ['A', 'B', 'C', 'D'] as const;
export const MAX_COMPUTED_METRIC_VARIABLE_COUNT = COMPUTED_METRIC_VARIABLE_KEYS.length;

const precedence: Record<BinaryOperator, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '^': 3,
};
const computedMetricVariableKeySet = new Set<string>(COMPUTED_METRIC_VARIABLE_KEYS);
const computedMetricVariableKeysList = COMPUTED_METRIC_VARIABLE_KEYS.join(', ');

const isIdentifierStart = (char: string): boolean => /[A-Za-z_]/.test(char);
const isIdentifierPart = (char: string): boolean => /[A-Za-z0-9_]/.test(char);
const isDigit = (char: string): boolean => /[0-9]/.test(char);
const multiplicationSign = String.fromCharCode(215);
const normalizeMultiplicationOperators = (formula: string): string =>
  formula.replaceAll(multiplicationSign, '*').replaceAll(/\b[xX]\b/g, '*');
const isFormulaFunctionName = (name: string): name is FormulaFunctionName =>
  Object.hasOwn(formulaFunctionDefinitions, name);

const tokenizeFormula = (formula: string): FormulaToken[] => {
  const normalizedFormula = normalizeMultiplicationOperators(formula);
  const tokens: FormulaToken[] = [];
  let idx = 0;

  while (idx < normalizedFormula.length) {
    const char = normalizedFormula[idx];
    if (/\s/.test(char)) {
      idx += 1;
    } else if (char === '(') {
      tokens.push({ type: 'lparen' });
      idx += 1;
    } else if (char === ')') {
      tokens.push({ type: 'rparen' });
      idx += 1;
    } else if (char === ',') {
      tokens.push({ type: 'comma' });
      idx += 1;
    } else if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^') {
      tokens.push({ type: 'operator', value: char });
      idx += 1;
    } else if (
      isDigit(char) ||
      (char === '.' && idx + 1 < normalizedFormula.length && isDigit(normalizedFormula[idx + 1]))
    ) {
      let end = idx + 1;
      while (
        end < normalizedFormula.length &&
        (isDigit(normalizedFormula[end]) || normalizedFormula[end] === '.')
      ) {
        end += 1;
      }
      const value = Number(normalizedFormula.slice(idx, end));
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        throw new TypeError(`Invalid number at position ${idx}`);
      }
      tokens.push({ type: 'number', value });
      idx = end;
    } else if (isIdentifierStart(char)) {
      let end = idx + 1;
      while (end < normalizedFormula.length && isIdentifierPart(normalizedFormula[end])) {
        end += 1;
      }
      const value = normalizedFormula.slice(idx, end);
      tokens.push({ type: 'identifier', value });
      idx = end;
    } else {
      throw new Error(`Unexpected token "${char}" at position ${idx}`);
    }
  }

  return tokens;
};

class FormulaParser {
  private readonly tokens: FormulaToken[];
  private index = 0;

  constructor(tokens: FormulaToken[]) {
    this.tokens = tokens;
  }

  parse(): FormulaAstNode {
    const ast = this.parseExpression(0);
    const token = this.current();
    if (token) {
      if (token.type === 'rparen') {
        throw new Error('Mismatched parentheses in formula');
      }
      throw new Error(`Unexpected token "${this.describeToken(token)}"`);
    }
    return ast;
  }

  private parseExpression(minPrecedence: number): FormulaAstNode {
    let left = this.parsePrimary();

    while (true) {
      const token = this.current();
      if (token?.type !== 'operator' || precedence[token.value] < minPrecedence) {
        break;
      }

      const operator = token.value;
      this.index += 1;
      const rightToken = this.current();
      if (!rightToken || rightToken.type === 'rparen' || rightToken.type === 'comma') {
        throw new Error(`Missing operand for operator "${operator}"`);
      }
      const right = this.parseExpression(
        operator === '^' ? precedence[operator] : precedence[operator] + 1,
      );
      left = { type: 'binary', operator, left, right };
    }

    return left;
  }

  private parsePrimary(): FormulaAstNode {
    const token = this.current();
    if (!token) {
      throw new Error('Formula did not resolve to a single expression');
    }

    if (token.type === 'number') {
      this.index += 1;
      return { type: 'number', value: token.value };
    }

    if (token.type === 'operator' && token.value === '-' && this.peek()?.type === 'number') {
      this.index += 1;
      const numberToken = this.current();
      if (numberToken?.type !== 'number') {
        throw new Error('Missing operand for operator "-"');
      }
      this.index += 1;
      return { type: 'number', value: -numberToken.value };
    }

    if (token.type === 'identifier') {
      this.index += 1;
      if (this.current()?.type === 'lparen') {
        return this.parseFunctionCall(token.value);
      }
      return { type: 'identifier', name: token.value };
    }

    if (token.type === 'lparen') {
      this.index += 1;
      const expression = this.parseExpression(0);
      if (this.current()?.type !== 'rparen') {
        throw new Error('Mismatched parentheses in formula');
      }
      this.index += 1;
      return expression;
    }

    throw new Error(`Unexpected token "${this.describeToken(token)}"`);
  }

  private parseFunctionCall(name: string): FormulaAstNode {
    if (!isFormulaFunctionName(name)) {
      throw new Error(`Unsupported function "${name}"`);
    }
    const definition = formulaFunctionDefinitions[name];

    this.index += 1; // opening parenthesis
    if (this.current()?.type === 'rparen') {
      throw new Error(definition.missingArgsError);
    }

    const args: FormulaAstNode[] = [this.parseExpression(0)];
    while (this.current()?.type === 'comma') {
      this.index += 1;
      args.push(this.parseExpression(0));
    }
    if (args.length < definition.minArgs) {
      throw new Error(definition.missingArgsError);
    }
    if (args.length > definition.maxArgs) {
      throw new Error(definition.tooManyArgsError);
    }
    if (this.current()?.type !== 'rparen') {
      throw new Error('Mismatched parentheses in formula');
    }
    this.index += 1;

    const [firstArg, secondArg] = args;
    if (!firstArg) {
      throw new Error(definition.missingArgsError);
    }
    if (args.length === 1) {
      return { type: 'function', name, args: [firstArg] };
    }
    if (!secondArg) {
      throw new Error(definition.missingArgsError);
    }
    return { type: 'function', name, args: [firstArg, secondArg] };
  }

  private current(): FormulaToken | undefined {
    return this.tokens[this.index];
  }

  private peek(): FormulaToken | undefined {
    return this.tokens[this.index + 1];
  }

  private describeToken(token: FormulaToken): string {
    switch (token.type) {
      case 'identifier':
        return token.value;
      case 'number':
        return String(token.value);
      case 'operator':
        return token.value;
      case 'lparen':
        return '(';
      case 'rparen':
        return ')';
      case 'comma':
        return ',';
      default: {
        const exhaustiveCheck: never = token;
        return String(exhaustiveCheck);
      }
    }
  }
}

const collectIdentifiers = (ast: FormulaAstNode, identifiers = new Set<string>()): Set<string> => {
  switch (ast.type) {
    case 'identifier':
      identifiers.add(ast.name);
      return identifiers;
    case 'number':
      return identifiers;
    case 'binary':
      collectIdentifiers(ast.left, identifiers);
      collectIdentifiers(ast.right, identifiers);
      return identifiers;
    case 'function':
      ast.args.forEach((arg) => collectIdentifiers(arg, identifiers));
      return identifiers;
    default: {
      const exhaustiveCheck: never = ast;
      throw new Error(`Unsupported AST node: ${String(exhaustiveCheck)}`);
    }
  }
};

const evaluateConstantExpression = (ast: FormulaAstNode): number | null => {
  switch (ast.type) {
    case 'number':
      return ast.value;
    case 'identifier':
      return null;
    case 'binary': {
      const left = evaluateConstantExpression(ast.left);
      const right = evaluateConstantExpression(ast.right);
      if (left === null || right === null) {
        return null;
      }
      switch (ast.operator) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '^':
          return left ** right;
        default: {
          const exhaustiveCheck: never = ast.operator;
          throw new Error(`Unsupported operator: ${String(exhaustiveCheck)}`);
        }
      }
    }
    case 'function': {
      switch (ast.name) {
        case 'log': {
          const value = evaluateConstantExpression(ast.args[0]);
          const base = ast.args[1] ? evaluateConstantExpression(ast.args[1]) : Math.E;
          return value === null || base === null ? null : Math.log(value) / Math.log(base);
        }
        default: {
          const exhaustiveCheck: never = ast;
          throw new Error(`Unsupported function: ${String(exhaustiveCheck)}`);
        }
      }
    }
    default: {
      const exhaustiveCheck: never = ast;
      throw new Error(`Unsupported AST node: ${String(exhaustiveCheck)}`);
    }
  }
};

const validateLogDomains = (ast: FormulaAstNode): string[] => {
  const errors: string[] = [];
  const visit = (node: FormulaAstNode) => {
    switch (node.type) {
      case 'identifier':
      case 'number':
        return;
      case 'binary':
        visit(node.left);
        visit(node.right);
        return;
      case 'function': {
        node.args.forEach(visit);
        switch (node.name) {
          case 'log': {
            const value = evaluateConstantExpression(node.args[0]);
            const base = node.args[1] ? evaluateConstantExpression(node.args[1]) : null;
            if (value !== null && value <= 0) {
              errors.push('log() value must be greater than 0');
            }
            if (base !== null && (base <= 0 || Math.abs(base - 1) < Number.EPSILON)) {
              errors.push('log() base must be greater than 0 and not equal to 1');
            }
            return;
          }
          default: {
            const exhaustiveCheck: never = node;
            throw new Error(`Unsupported function: ${String(exhaustiveCheck)}`);
          }
        }
      }
      default: {
        const exhaustiveCheck: never = node;
        throw new Error(`Unsupported AST node: ${String(exhaustiveCheck)}`);
      }
    }
  };

  visit(ast);
  return errors;
};

export const parseComputedMetricFormula = (
  formula: string,
  variableKeys: readonly string[],
): FormulaParseResult => {
  if (variableKeys.length > MAX_COMPUTED_METRIC_VARIABLE_COUNT) {
    return {
      ok: false,
      errors: [
        `Computed metrics support up to ${MAX_COMPUTED_METRIC_VARIABLE_COUNT} variables: ${computedMetricVariableKeysList}`,
      ],
    };
  }

  const invalidVariableKeys = variableKeys.filter((key) => !computedMetricVariableKeySet.has(key));
  if (invalidVariableKeys.length > 0) {
    return {
      ok: false,
      errors: invalidVariableKeys.map(
        (key) => `Unsupported variable "${key}". Use only ${computedMetricVariableKeysList}`,
      ),
    };
  }

  if (!formula.trim()) {
    return { ok: false, errors: ['Formula cannot be empty'] };
  }

  try {
    const tokens = tokenizeFormula(formula);
    const ast = new FormulaParser(tokens).parse();
    const identifierSet = collectIdentifiers(ast);

    const unknownVariables = Array.from(identifierSet).filter((identifier) => {
      return !variableKeys.includes(identifier);
    });
    if (unknownVariables.length > 0) {
      return {
        ok: false,
        errors: unknownVariables.map((identifier) => `Unknown variable "${identifier}"`),
      };
    }

    const logDomainErrors = validateLogDomains(ast);
    if (logDomainErrors.length > 0) {
      return { ok: false, errors: logDomainErrors };
    }

    return { ok: true, ast, identifiers: Array.from(identifierSet) };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse formula'],
    };
  }
};

export type BinaryOperator = '+' | '-' | '*' | '/';

export type FormulaAstNode =
  | { type: 'identifier'; name: string }
  | { type: 'number'; value: number }
  | { type: 'binary'; operator: BinaryOperator; left: FormulaAstNode; right: FormulaAstNode };

type FormulaToken =
  | { type: 'identifier'; value: string }
  | { type: 'number'; value: number }
  | { type: 'operator'; value: BinaryOperator }
  | { type: 'lparen' }
  | { type: 'rparen' };

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
};
const computedMetricVariableKeySet = new Set<string>(COMPUTED_METRIC_VARIABLE_KEYS);
const computedMetricVariableKeysList = COMPUTED_METRIC_VARIABLE_KEYS.join(', ');

const isIdentifierStart = (char: string): boolean => /[A-Za-z_]/.test(char);
const isIdentifierPart = (char: string): boolean => /[A-Za-z0-9_]/.test(char);
const isDigit = (char: string): boolean => /[0-9]/.test(char);
const normalizeMultiplicationOperators = (formula: string): string =>
  formula.replace(/\u00D7/g, '*').replace(/\b[xX]\b/g, '*');

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
    } else if (char === '+' || char === '-' || char === '*' || char === '/') {
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
        throw new Error(`Invalid number at position ${idx}`);
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

const toRpn = (tokens: FormulaToken[]): FormulaToken[] => {
  const output: FormulaToken[] = [];
  const operators: FormulaToken[] = [];

  tokens.forEach((token) => {
    switch (token.type) {
      case 'identifier':
      case 'number':
        output.push(token);
        break;
      case 'operator': {
        while (operators.length > 0) {
          const top = operators[operators.length - 1];
          if (top.type !== 'operator') {
            break;
          }
          if (precedence[top.value] >= precedence[token.value]) {
            output.push(operators.pop() as FormulaToken);
          } else {
            break;
          }
        }
        operators.push(token);
        break;
      }
      case 'lparen':
        operators.push(token);
        break;
      case 'rparen': {
        let foundLeftParen = false;
        while (operators.length > 0) {
          const top = operators.pop() as FormulaToken;
          if (top.type === 'lparen') {
            foundLeftParen = true;
            break;
          }
          output.push(top);
        }
        if (!foundLeftParen) {
          throw new Error('Mismatched parentheses in formula');
        }
        break;
      }
      default: {
        const exhaustiveCheck: never = token;
        throw new Error(`Unhandled token in parser: ${String(exhaustiveCheck)}`);
      }
    }
  });

  while (operators.length > 0) {
    const top = operators.pop() as FormulaToken;
    if (top.type === 'lparen' || top.type === 'rparen') {
      throw new Error('Mismatched parentheses in formula');
    }
    output.push(top);
  }

  return output;
};

const buildAstFromRpn = (rpnTokens: FormulaToken[]): FormulaAstNode => {
  const stack: FormulaAstNode[] = [];

  rpnTokens.forEach((token) => {
    if (token.type === 'identifier') {
      stack.push({ type: 'identifier', name: token.value });
    } else if (token.type === 'number') {
      stack.push({ type: 'number', value: token.value });
    } else if (token.type === 'operator') {
      const right = stack.pop();
      const left = stack.pop();
      if (!left || !right) {
        throw new Error(`Missing operand for operator "${token.value}"`);
      }
      stack.push({
        type: 'binary',
        operator: token.value,
        left,
        right,
      });
    } else {
      throw new Error(`Unexpected token "${token.type}" in RPN expression`);
    }
  });

  if (stack.length !== 1) {
    throw new Error('Formula did not resolve to a single expression');
  }
  return stack[0];
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
    const identifierSet = new Set<string>();
    tokens.forEach((token) => {
      if (token.type === 'identifier') {
        identifierSet.add(token.value);
      }
    });

    const unknownVariables = Array.from(identifierSet).filter((identifier) => {
      return !variableKeys.includes(identifier);
    });
    if (unknownVariables.length > 0) {
      return {
        ok: false,
        errors: unknownVariables.map((identifier) => `Unknown variable "${identifier}"`),
      };
    }

    const rpn = toRpn(tokens);
    const ast = buildAstFromRpn(rpn);
    return { ok: true, ast, identifiers: Array.from(identifierSet) };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse formula'],
    };
  }
};

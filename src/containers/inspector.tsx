import ts from 'typescript';
import { flattenArray } from './flatten';

export type ExtractedParameter = {
    name: string;
    kind: { tsKind: ts.SyntaxKind, toString: string };
    type: { tsType: ts.Type | undefined, toString: string };
    optional: boolean | undefined;
    defaultVal: string | undefined;
    value: string;
};

const syntaxKindToString = (kind: ts.SyntaxKind): string => {
    const strKind = ts.SyntaxKind[kind];
    return strKind ? strKind : 'unknown';
};

const typeToString = (type: ts.Type | undefined, typeChecker: ts.TypeChecker): string => {
    return type ? typeChecker.typeToString(type) : 'unknown';
};

export const extractedParametersToString = (params: ExtractedParameter[]) => {
    const paramStrings = params.map(p =>
        `${p.name}: {\n  name: ${p.name}\n  kind: ${p.kind.toString}\n  type: ${p.type.toString}\n  optional: ${p.optional}\n  default: ${p.defaultVal}\n  }`
    );
    return `type = { \n  ${paramStrings.join("\n  ")} \n } `;
};

const extractBindings = (bindingPattern: ts.ObjectBindingPattern, sourceFile: ts.SourceFile | undefined, typeChecker: ts.TypeChecker): Record<string, ExtractedParameter> => {
    const bindings: { [name: string]: ExtractedParameter } = {};
    for (const element of bindingPattern.elements) {
        const name = element.name.getText(sourceFile);
        const defaultVal = element.initializer ? element.initializer.getText(sourceFile) : undefined;
        bindings[name] = {
            name: name,
            kind: { tsKind: element.kind, toString: syntaxKindToString(element.kind) },
            type: { tsType: undefined, toString: typeToString(undefined, typeChecker) },
            optional: undefined,
            defaultVal: defaultVal,
            value: defaultVal ?? ''
        };
    }
    return bindings;
};

const extractTypeLiterals = (typeLiteralNode: ts.TypeLiteralNode, sourceFile: ts.SourceFile | undefined, typeChecker: ts.TypeChecker): ExtractedParameter[] => {
    const typeLiterals: ExtractedParameter[] = [];
    for (const member of typeLiteralNode.members) {
        const type = ts.isPropertySignature(member) && member.type ? typeChecker.getTypeFromTypeNode(member.type) : undefined;
        typeLiterals.push({
            name: member.name ? member.name.getText(sourceFile) : '',
            kind: { tsKind: member.kind, toString: syntaxKindToString(member.kind) },
            type: { tsType: type, toString: typeToString(type, typeChecker) },
            optional: ts.isPropertySignature(member) && member.questionToken ? true : false,
            defaultVal: undefined,
            value: ''
        });
    }
    return typeLiterals;
};

const extractParameter = (parameterDecl: ts.ParameterDeclaration, sourceFile: ts.SourceFile | undefined, typeChecker: ts.TypeChecker): ExtractedParameter[] => {
    const bindings = ts.isObjectBindingPattern(parameterDecl.name) ? extractBindings(parameterDecl.name, sourceFile, typeChecker) : undefined;
    const literals = parameterDecl.type && ts.isTypeLiteralNode(parameterDecl.type) ? extractTypeLiterals(parameterDecl.type, sourceFile, typeChecker) : undefined;

    if (bindings && literals) {
        return literals.map(literal => {
            const match = bindings[literal.name];
            return match ? {
                name: literal.name,
                kind: literal.kind,
                type: literal.type,
                optional: literal.optional,
                defaultVal: match.defaultVal,
                value: match.defaultVal ?? ''
            } : literal;
        });
    } else if (bindings && !literals) {
        return Object.values(bindings);
    } else if (!bindings && literals) {
        return literals;
    } else {
        const type = parameterDecl.type ? typeChecker.getTypeFromTypeNode(parameterDecl.type) : parameterDecl.initializer ? typeChecker.getTypeAtLocation(parameterDecl) : undefined;
        return [{
            name: parameterDecl.name.getText(sourceFile),
            kind: { tsKind: parameterDecl.kind, toString: syntaxKindToString(parameterDecl.kind) },
            type: { tsType: type, toString: typeToString(type, typeChecker) },
            optional: typeChecker.isOptionalParameter(parameterDecl),
            defaultVal: parameterDecl.initializer ? parameterDecl.initializer.getText(sourceFile) : undefined,
            value: parameterDecl.initializer ? parameterDecl.initializer.getText(sourceFile) : '',
        }];
    }
};

const extractParameters = (params: ts.NodeArray<ts.ParameterDeclaration>, sourceFile: ts.SourceFile | undefined, typeChecker: ts.TypeChecker): ExtractedParameter[] => {
    return flattenArray(params.map(p => extractParameter(p, sourceFile, typeChecker)));
};

export const checkExpressionType = (expression: string, type: ts.Type | undefined) => {
    const sourceFile = ts.createSourceFile('file.ts', expression, ts.ScriptTarget.Latest, true);
    const program: ts.Program = ts.createProgram(['file.ts'], { emitDeclarationOnly: true });
    const typeChecker: ts.TypeChecker = program.getTypeChecker();

    const typeName = type ? typeToString(type, typeChecker) : 'String';
    const node: ts.TypeReferenceNode = ts.factory.createTypeReferenceNode(typeName, []);
    console.log({ node });

    // const source = "[33]";
    console.log(`expression: ${expression}`);
    const result = ts.transpileModule(expression, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
    console.log(JSON.stringify(result));

    const statements = sourceFile.statements.map(s => `st: ${s.getText(sourceFile)}`);
    const children = sourceFile.getChildren(sourceFile).map(c => `ch: ${typeToString(typeChecker.getTypeAtLocation(c), typeChecker)} [${syntaxKindToString(c.kind)}]`);
    const statementOutput = `statement count: ${statements.length} =>\n  ${statements.join('\n  ')}  \n`;
    const childNodeOutput = `child node count: ${children.length} =>\n  ${children.join('\n  ')}  \n`;
    console.log(`checking for type: ${typeToString(type, typeChecker)}\n${statementOutput}${childNodeOutput}`);
};

export const transpileSource = (input: string) => ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS } });

export const extractFunctionParameterSignature = (filename: string, aliasName: string): ExtractedParameter[] => {
    const program: ts.Program = ts.createProgram([filename], { emitDeclarationOnly: true });
    const sourceFile: ts.SourceFile | undefined = program.getSourceFile(filename);
    const typeChecker: ts.TypeChecker = program.getTypeChecker();

    const func: ts.FunctionDeclaration | undefined = sourceFile?.statements
        .filter(ts.isFunctionDeclaration)
        .find((s) => s.name?.getText(sourceFile) === aliasName);

    const arrow: ts.VariableStatement | undefined = sourceFile?.statements
        .filter(ts.isVariableStatement)
        .find((s) => ts.isVariableStatement(s) && s.declarationList.declarations[0]?.name.getText(sourceFile) === aliasName);

    if (!func && !arrow) {
        throw new Error(`Function: '${aliasName}' not found in file: '${filename}'`);
    }

    if (func) {
        return extractParameters(func.parameters, sourceFile, typeChecker);
    } else if (arrow) {
        const initializer = arrow.declarationList.declarations[0]?.initializer;
        return initializer && ts.isArrowFunction(initializer) ? extractParameters(initializer.parameters, sourceFile, typeChecker) : [];
    }
    return [];
};

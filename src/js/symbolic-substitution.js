
export {substituteSymbols, needParens, getEnvironmentDeepCopy, addArrayToEnv, substitute, getExpressionString,
    isArithmeticPlusOrMinus, hasParens, isArithmeticMulOrDivOrPow , substituteProgram};
import * as escodegen from 'escodegen';
let funcArgs;

const substituteSymbols = (parsedCode, env, codeStr) =>{
    return substituteFunctionsByType[parsedCode.type](parsedCode, env, codeStr);
};

const substituteFunctionsByType = {
    'Program': substituteProgram,
    'FunctionDeclaration': substituteFunctionDeclaration,
    'ExpressionStatement': substituteExpressionStatement,
    'VariableDeclaration': substituteVariableDeclaration,
    'AssignmentExpression': substituteAssignmentExpression,
    'BlockStatement': substituteBlockStatement,
    'WhileStatement': substituteWhileStatement,
    'IfStatement': substituteIfStatement,
    'ReturnStatement': substituteReturnStatement,
};

function substituteProgram(program, env, codeStr){
    funcArgs = [];
    let body = program.body;
    let functionDecIndex;
    let codeAfterSymSub = codeStr;
    for(let i = 0; i < body.length; i++){
        let type = body[i].type;
        if(type === 'FunctionDeclaration'){functionDecIndex = i;}
        else{ // if(type === 'VariableDeclaration'){
            body[i].declarations.map((declaration) => {
                addGlobal(declaration);
            });
        }
    }
    return substituteFunctionDeclaration(program.body[functionDecIndex], env, codeAfterSymSub);
}

function addGlobal(globalDeclaration){
    // let init = globalDeclaration.init;
    // if(init != null){
    let name = globalDeclaration.id.name;
    funcArgs.push(name);
    // }
}

function substituteFunctionDeclaration(functionDeclaration, env, codeStr){
    functionDeclaration.params.map((param) => funcArgs.push(param.name));
    return substituteSymbols(functionDeclaration.body, env, codeStr);
}

function substituteExpressionStatement(expressionStatement, env, codeStr){
    return substituteSymbols(expressionStatement.expression, env, codeStr);
}

function substituteVariableDeclaration(variableDeclaration, env, codeStr){
    let codeAfterSymSub = codeStr;
    let declarations = variableDeclaration.declarations;
    declarations.map((declaration) => {
        let init = declaration.init;
        if(init != null){
            let initAfterSub = substitute(init, env);
            let name = declaration.id.name;
            env[name] = initAfterSub;
            if(init.type === 'ArrayExpression'){
                addArrayToEnv(init.elements, name, env);
            }
            codeAfterSymSub = removeLine(codeStr, declaration.loc.start.line - 1);
        }
    });
    return codeAfterSymSub;
}

function addArrayToEnv(arr, name, env){
    for(let i=0; i<arr.length; i++){
        env[name+'['+ i +']'] = substitute(arr[i],env);
    }
}

function substituteAssignmentExpression(assignmentExpression, env, codeStr){
    let name = getExpressionString(assignmentExpression.left);
    let val = substitute(assignmentExpression.right, env);
    env[name] = val;
    if(funcArgs.includes(name)){
        return replaceStr(codeStr, assignmentExpression.right, val);
    }
    else{
        return removeLine(codeStr, assignmentExpression.loc.start.line - 1);
    }
}

function removeLine(codeStr, lineNumber){
    codeStr[lineNumber] = '';
    return codeStr;
}

function substituteBlockStatement(blockStatement, env, codeStr){
    let codeAfterSymSub = codeStr;
    blockStatement.body.map((statement)=>{
        codeAfterSymSub = substituteSymbols(statement, env, codeAfterSymSub);
    });
    return codeAfterSymSub;
}

function substituteWhileStatement(whileStatement, env, codeStr){
    let testAfterSub = substitute(whileStatement.test, env);
    let codeAfterSymSub = replaceStr(codeStr, whileStatement.test, testAfterSub);
    return substituteSymbols(whileStatement.body, env, codeAfterSymSub);
}

function substituteIfStatement(ifStatement, env, codeStr){
    let testAfterSub = substitute(ifStatement.test, env);
    let codeAfterSymSub = replaceStr(codeStr, ifStatement.test, testAfterSub);
    codeAfterSymSub = substituteSymbols(ifStatement.consequent, getEnvironmentDeepCopy(env), codeAfterSymSub);
    let alternate = ifStatement.alternate;
    if (alternate != null) {
        if(alternate.type === 'IfStatement'){
            codeAfterSymSub = substituteIfStatement(alternate, getEnvironmentDeepCopy(env), codeAfterSymSub);
        }
        else{
            codeAfterSymSub = substituteSymbols(alternate, getEnvironmentDeepCopy(env), codeAfterSymSub);
        }
    }
    return codeAfterSymSub;
}

function substituteReturnStatement(returnStatement, env, codeStr){
    let returnArg = returnStatement.argument;
    if(returnArg!=null && !funcArgs.includes(returnArg.name)){
        let argAfterSymSub = substitute(returnArg, env);
        return replaceStr(codeStr, returnArg, argAfterSymSub);
    }
    return codeStr;
}

function getEnvironmentDeepCopy(env){
    return JSON.parse(JSON.stringify(env));
}

function replaceStr(code, oldStr, newStr){
    let lineInd = oldStr.loc.start.line - 1;
    let line = code[lineInd];
    let preStr = line.substring(0, oldStr.loc.start.column);
    let postStr = line.substring(oldStr.loc.end.column);
    code[lineInd] = preStr + newStr + postStr;
    return code;
}

function substitute(parsedCode, env){
    let code = getExpressionString(parsedCode);
    code = code.replace(/ +(?= )/g,'').replace(/[(]/g, '( ').replace(/[)]/g, ' )');
    // .replace(/[([]/g, '[ ')
    // .replace(/[)\]]/g, ' ]');
    let tokens = code.split(' ');
    for(let i=0; i<tokens.length; i++){
        let token = tokens[i];
        if(env[token]){
            if(needParens(env, tokens, token, i)){
                tokens[i] = '(' + env[token] + ')';
            }
            else{
                tokens[i] = env[token];
            }
        }
    }
    return tokens.join(' ');
}

function isArithmeticMulOrDivOrPow(tokens, index){
    let ops = ['*', '\\', '^'];
    return ops.includes(tokens[index-1]) || ops.includes(tokens[index+1]);
}

function needParens(env, tokens, token, index){
    return isArithmeticPlusOrMinus(env[token]) && !hasParens(env[token]) && isArithmeticMulOrDivOrPow(tokens, index);
}

function isArithmeticPlusOrMinus(str){
    let strArr = str.split(' ');
    return strArr.includes('+') || strArr.includes('-');
}

function hasParens(str){
    return str.substring(0,1) === '(' || str.substring(0,1) === '[';
}

function getExpressionString(parsedCode){
    return escodegen.generate(parsedCode);
}

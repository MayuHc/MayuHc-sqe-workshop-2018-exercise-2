import {getEnvironmentDeepCopy, substitute, addArrayToEnv, getExpressionString} from './symbolic-substitution';

function evaluateCode(code, args, colors){
    let env = {};
    let body = code.body;
    let functionDecIndex;
    for(let i = 0; i < body.length; i++){
        let type = body[i].type;
        if(type === 'FunctionDeclaration'){
            functionDecIndex = i;
        }
        else{ //if(type === 'VariableDeclaration'){
            body[i].declarations.map((declaration) => {
                addGlobal(declaration, env);
            });
        }
    }
    addStrArgsToEnv(env, code.body[functionDecIndex].params, args);
    return evaluateByType(code.body[functionDecIndex].body, env, colors);
}

function addStrArgsToEnv(env, args, argValues){
    let argsArray = getArgsArray(argValues);
    for(let i=0; i<args.length; i++){
        let val = argsArray[i];
        if(Array.isArray(val)){
            addStrArrayToEnv(val, args[i].name, env);
        }
        env[args[i].name] = substituteStr(argsArray[i].toString(), env);
    }
}

function getArgsArray(argsStr){
    let tokens = argsStr.split(',');
    let argsArray = [];
    for(let i=0; i<tokens.length; i++){
        if(tokens[i].charAt(0)==='['){
            let arrayStr = tokens[i];
            while(tokens[i].substring(tokens[i].length - 1) != ']'){
                i++;
                arrayStr = arrayStr+ ',' + tokens[i];
            }
            let arrayElementsStr = arrayStr.substring(1,arrayStr.length-1);
            let elementsArray = arrayElementsStr.split(',');
            argsArray.push(elementsArray);
        }
        else{
            argsArray.push(tokens[i]);
        }
    }
    return argsArray;
}

function addGlobal(globalDeclaration,env){
    let init = globalDeclaration.init;
    let name = globalDeclaration.id.name;
    if(init != null){
        env[name] = getExpressionString(init);
        if(init.type === 'ArrayExpression'){
            addArrayToEnv(init.elements, name, env);
        }
    }
}

const evaluateByType = (parsedCode, env, codeStr) =>{
    return evalFunctionsByType[parsedCode.type](parsedCode, env, codeStr);
};

const evalFunctionsByType = {
    'ExpressionStatement': evalExpressionStatement,
    'AssignmentExpression': evalAssignmentExpression,
    'BlockStatement': evalBlockStatement,
    'WhileStatement': evalWhileStatement,
    'IfStatement': evalIfStatement,
    'ReturnStatement': evalReturnStatement,
};

function evalExpressionStatement(expressionStatement, env, colors){
    return evaluateByType(expressionStatement.expression, env, colors);
}

function evalAssignmentExpression(assignmentExpression, env, colors){
    let name = assignmentExpression.left.name;
    env[name] = substitute(assignmentExpression.right, env);
    return colors;
}

function evalBlockStatement(blockStatement, env, colors){
    let colorsAfterEval = colors;
    blockStatement.body.map((statement)=>{
        colorsAfterEval = evaluateByType(statement, env, colorsAfterEval);
    });
    return colorsAfterEval;
}

function evalWhileStatement(whileStatement, env, colors){
    return evaluateByType(whileStatement.body, env, colors);
}

function evalIfStatement(ifStatement, env, colors){
    let cond = substitute(ifStatement.test, env);
    let isTrue = eval(cond);
    let lineNum = ifStatement.loc.start.line - 1;
    let codeAfterSymSub;
    if(isTrue) {colors[lineNum] = '<span style="background-color:#50ff5d">';}
    else{colors[lineNum] = '<span style="background-color: #ff1815">';}
    codeAfterSymSub = evaluateByType(ifStatement.consequent, getEnvironmentDeepCopy(env), colors);
    let alternate = ifStatement.alternate;
    if (alternate != null) {
        if(alternate.type === 'IfStatement'){
            codeAfterSymSub = evalIfStatement(alternate, getEnvironmentDeepCopy(env), codeAfterSymSub);
        }
        else{
            codeAfterSymSub = evaluateByType(alternate, getEnvironmentDeepCopy(env), codeAfterSymSub);
        }
    }
    return codeAfterSymSub;
}

function substituteStr(codeStr, env){
    let code = codeStr.replace(/ +(?= )/g,'') // replace all the multiple spaces with a single space
        .replace(/[(]/g, '( ')
        .replace(/[)]/g, ' )');
        // .replace(/[([]/g, '( ')
        // .replace(/[)\]]/g, ' )');
    let tokens = code.split(' ');
    for(let i=0; i<tokens.length; i++){
        let token = tokens[i];
        if(env[token]){
            // if(needParens(env, tokens, token, i)){
            //     tokens[i] = '(' + env[token] + ')';
            // }
            // else{
            tokens[i] = env[token];
            // }
        }
    }
    return tokens.join(' ');
}

function addStrArrayToEnv(arr, name, env){
    for(let i=0; i<arr.length; i++){
        env[name +'['+ i +']'] = substituteStr(arr[i].toString(),env);
    }
}

function evalReturnStatement(returnStatement, env, colors){
    return colors;
}

export {evaluateCode, substituteStr, addStrArrayToEnv,getArgsArray};
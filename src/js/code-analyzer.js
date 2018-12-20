import * as esprima from 'esprima';
import {substituteSymbols} from './symbolic-substitution';
import {evaluateCode} from './code-evaluator';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse,{ loc: true});
};

const substituteAndColor = (code, args) =>{
    let parsedCode = parseCode(code);
    let codeAfterSymSub = substituteSymbols(parsedCode, {} ,code.split('\n'));
    let codeStr = getFunctionStrFromLines(codeAfterSymSub);
    let codeArr =  codeStr.split('\n');
    let colors = new Array(codeArr.length);
    colors = evaluateCode(parseCode(codeStr), args, colors);
    return addColors(codeArr,colors);
};


function addColors(codeArr, colors){
    for(let i=0;i<codeArr.length;i++){
        codeArr[i] = codeArr[i].replace(/ /g, '&nbsp');
        if(colors[i] != null){
            codeArr[i] = colors[i] + codeArr[i] + '</span>';
        }
    }
    return codeArr;
}

function getFunctionStrFromLines(codeLines){
    return codeLines.reduce(
        (acc, curr) => {
            if(curr.replace(/\s/g, '').length){
                return acc + curr + '\n';
            }
            else{
                return acc;
            }
        }
        , '');
}

export {parseCode,substituteAndColor};

import assert from 'assert';
import {
    hasParens,
    isArithmeticPlusOrMinus,
    isArithmeticMulOrDivOrPow,
    substitute, substituteProgram
} from '../src/js/symbolic-substitution';
import {parseCode, substituteAndColor} from '../src/js/code-analyzer';
import {substituteStr, addStrArrayToEnv, evaluateCode, getArgsArray} from '../src/js/code-evaluator';


describe('Test isArithmeticPlusOrMinus', () => {
    it('Test the function isArithmeticPlusOrMinus plus case', () => {
        assert.equal(true, isArithmeticPlusOrMinus('( x + 1 )'));
    });
    it('Test the function isArithmeticPlusOrMinus minus case', () => {
        assert.equal(true, isArithmeticPlusOrMinus('z - 1 )'));
    });
    it('Test the function isArithmeticPlusOrMinus false case', () => {
        assert.equal(false, isArithmeticPlusOrMinus('z * 1 )'));
    });
});

describe('Test hasParens', () => {
    it('Test the function hasParens', () => {
        assert.equal(true, hasParens('( x + 1 )'));
    });
    it('Test the function hasParens false case', () => {
        assert.equal(false, hasParens('x + 1'));
    });
});

describe('Test isArithmeticMulOrDivOrPow', () => {
    it('Test the function isArithmeticMulOrDivOrPow multiply case', () => {
        assert.equal(true, isArithmeticMulOrDivOrPow(['x' ,'*', '1' ], 0));
    });
    it('Test the function isArithmeticMulOrDivOrPow power case', () => {
        assert.equal(true, isArithmeticMulOrDivOrPow(['z' ,'^', '1'], 2));
    });
    it('Test the function isArithmeticMulOrDivOrPow false case', () => {
        assert.equal(false, isArithmeticMulOrDivOrPow(['z' ,'^', '1'], 1));
    });
});

describe('Test substitute', () => {
    it('Test the function simple case 1', () => {
        assert.deepEqual(substitute(parseCode('x + 1'), {'x': '2'}), '2 + 1;');
    });
    it('Test the function simple case 2', () => {
        assert.equal(substitute(parseCode('x + 1'), {'y': '2'}), 'x + 1;');
    });
});

describe('Test substituteProgram', () => {
    it('Verify that it removes the variableDeclarations of local variables', () => {
        let code = 'let m = 0\n' +
            'function foo(x, y, z){    \n' +
            '    let a = x + 1;    \n' +
            '    let b = a + y;    \n' +
            '    let c = 0;    \n' +
            '    while (c < 10) {    \n' +
            '    a = x * y;    \n' +
            '    z = a * b * c;    \n' +
            '    }    \n' +
            '    return z;    \n' +
            '}';
        let ans = substituteProgram(parseCode(code), {}, code.split('\n'));
        assert.equal(ans[2], ['']);
        assert.equal(ans[3], ['']);
        assert.equal(ans[4], ['']);
        assert.equal(ans[6], ['']);
    });
});


//----------------------------------- code evaluator tests ----------------------------------------
describe('Test substitute', () => {
    it('Test the function simple case 1', () => {
        assert.deepEqual(substituteStr('x + 1', {'x': '2'}), '2 + 1');
    });
    it('Test the function simple case 2', () => {
        assert.equal(substituteStr('x + 1', {'y': '2'}), 'x + 1');
    });
});

describe('Test addStrArrayToEnv', () => {
    it('Test it adds the array correctly to env', () => {
        let env = {};
        addStrArrayToEnv([1,2,3], 'arr' ,env);
        assert.deepEqual(env , {'arr[0]':'1','arr[1]':'2','arr[2]':'3'});
    });
});

describe('Test getArgsArray', () => {
    it('Creates correctly array from the InputString', () => {
        assert.deepEqual(getArgsArray('1,2,x,[a,b,c]') , ['1','2','x',['a','b','c']]);
    });
});

describe('Test evaluateCode', () => {
    it('Check if it colors if statements', () => {
        let code = 'let m;\n' +
            'function foo(x, y, z){\n' +
            'if (x + 1 + y < z) {\n' +
            'return x + y + z + 0 + 5;\n' +
            '} else if (x + 1 + y < z * 2){\n' +
            'return x + y + z + 0 + x + 5;\n' +
            '} else {\n' +
            'return x + y + z + 0 + z + 5;\n'+
            '}\n'+
            '}';
        let colors = new Array(code.split('\n').length);
        evaluateCode(parseCode(code), '1,2,3' ,colors);
        assert.notEqual(colors[2].length, 0);
        assert.deepEqual(colors[3], null);
        assert.notEqual(colors[4].length, 0);
    });
});

describe('Test evaluateCode', () => {
    it('Check if it does not color if there are no if statements', () => {
        let code = 'let m = [1,2,3]\n' +
            'function foo(x, y, z){\n' +
            'while (x + 1 < z) {\n' +
            'z = (x + 1 + x + 1 + y) * 2;\n' +
            '}\n' +
            'return z;\n'+
        '}\n';
        let colors = new Array(code.split('\n').length);
        evaluateCode(parseCode(code), '1,2,3' ,colors);
        let filtered = colors.filter(function (el) {return el != null;});
        assert.deepEqual(filtered.length, 0);
    });
});

//------------------------------------full Flow tests---------------------------------------------
describe('Class Test 1 - Full flow', () => {
    it('Test from the class', () => {
        let code = 'function foo(x, y, z){\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;\n' +
            'while (c++ < 10) {\n' +
            'a = x * y;\n' +
            'z = a * b * c;\n' +
            '}\n' +
            'return z;\n' +
            '}';
        let input = '1,2,3';
        assert.deepEqual(substituteAndColor(code, input),
            ['function&nbspfoo(x,&nbspy,&nbspz){', 'while&nbsp(c++&nbsp<&nbsp10)&nbsp{', 'z&nbsp=&nbspx&nbsp*&nbspy&nbsp*&nbsp(x&nbsp+&nbsp1&nbsp+&nbspy)&nbsp*&nbsp0;',
                '}', 'return&nbspz;', '}', '']);
    });
});

describe('Class Test 2 - Full flow', () => { it('Test from the class', () => {
    let code = 'function foo(x, y, z){\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;\n' +
            'if (b < z) {\n' +
            'c = c + 5;\n' +
            'return x + y + z + c;\n' +
            '} else if (b < z * 2) {\n' +
            'c = c + x + 5;\n' +
            'return x + y + z + c;\n' +
            '} else {\n' +
            'c = c + z + 5;\n' +
            'return x + y + z + c;\n' +
            '}\n' +
            '}\n';
    let input = '1,2,3';
    assert.deepEqual(substituteAndColor(code, input), ['function&nbspfoo(x,&nbspy,&nbspz){', '<span style="background-color: #ff1815">if&nbsp(x&nbsp+&nbsp1&nbsp+&nbspy&nbsp<&nbspz)&nbsp{</span>', 'return&nbspx&nbsp+&nbspy&nbsp+&nbspz&nbsp+&nbsp0&nbsp+&nbsp5;', '<span style="background-color:#50ff5d">}&nbspelse&nbspif&nbsp(x&nbsp+&nbsp1&nbsp+&nbspy&nbsp<&nbspz&nbsp*&nbsp2)&nbsp{</span>', 'return&nbspx&nbsp+&nbspy&nbsp+&nbspz&nbsp+&nbsp0&nbsp+&nbspx&nbsp+&nbsp5;', '}&nbspelse&nbsp{', 'return&nbspx&nbsp+&nbspy&nbsp+&nbspz&nbsp+&nbsp0&nbsp+&nbspz&nbsp+&nbsp5;', '}', '}', '']);
});
});

describe('Class Test 3 - Full flow', () => { it('Adds parenthesis', () => {
    let code = 'function foo(x, y, z){\n' +
        'let a = x + 1;\n' +
        'let b = a + y;\n' +
        'let c = 0;\n' +
        'while (a < z){\n' +
        'c = a + b;\n' +
        'z = c * 2;\n' +
        '}\n' +
        'return z;\n' +
        '}\n';
    let input = '1,2,3';
    assert.deepEqual(substituteAndColor(code, input),
        ['function&nbspfoo(x,&nbspy,&nbspz){', 'while&nbsp(x&nbsp+&nbsp1&nbsp<&nbspz){', 'z&nbsp=&nbsp(x&nbsp+&nbsp1&nbsp+&nbspx&nbsp+&nbsp1&nbsp+&nbspy)&nbsp*&nbsp2;',
            '}', 'return&nbspz;', '}', ''
        ]);
});
});

describe('Full flow test', () => { it('Array inputs', () => {
    let code = 'function foo(x, y, z, p){\n' +
        'let a = x + 1;\n'+
        'let b = a + y;\n' +
        'let c = 0;\n' +
        'if (b == z[2]){\n' +
        'c = c + 5;\n' +
        'return x + y + z[0] + c;\n' +
        '} else if (b > p[0] * 2){\n' +
        'c = c + x + 5;\n' +
        'return x + y + c;\n'+
        '}\n'+ '}';
    let input = '3,2,[2,4,6],[1,2,3]';
    assert.deepEqual(substituteAndColor(code, input),
        ['function&nbspfoo(x,&nbspy,&nbspz,&nbspp){', '<span style="background-color:#50ff5d">if&nbsp(x&nbsp+&nbsp1&nbsp+&nbspy&nbsp==&nbspz[2]){</span>',
            'return&nbspx&nbsp+&nbspy&nbsp+&nbspz[0]&nbsp+&nbsp0&nbsp+&nbsp5;',
            '<span style="background-color:#50ff5d">}&nbspelse&nbspif&nbsp(x&nbsp+&nbsp1&nbsp+&nbspy&nbsp>&nbspp[0]&nbsp*&nbsp2){</span>',
            'return&nbspx&nbsp+&nbspy&nbsp+&nbsp0&nbsp+&nbspx&nbsp+&nbsp5;', '}', '}', ''
        ]);
});});

describe('Full flow test with global var', () => { it('Full flow - global', () => {
    let code = 'let m = 2;\n' +
    'function foo(x, y, z){\n' +
    'let a = x + 1;\n' +
    'let b = y + m;\n' +
    'if (b == z[2]){\n' +
    'return x + y + z[0];\n' +
    '}else if (b > a * 2){\n' +
    'return x + y + m;\n' +
    '}\n' +
    '}\n';
    let input = '1,2,[1,2,3]';
    assert.deepEqual(substituteAndColor(code, input),
        ['let&nbspm&nbsp=&nbsp2;','function&nbspfoo(x,&nbspy,&nbspz){','<span style="background-color: #ff1815">if&nbsp(y&nbsp+&nbspm&nbsp==&nbspz[2]){</span>', 'return&nbspx&nbsp+&nbspy&nbsp+&nbspz[0];',
            '<span style="background-color: #ff1815">}else&nbspif&nbsp(y&nbsp+&nbspm&nbsp>&nbsp(x&nbsp+&nbsp1)&nbsp*&nbsp2){</span>',
            'return&nbspx&nbsp+&nbspy&nbsp+&nbspm;', '}', '}', '']);
});
});

describe('Full flow test with string', () => { it('Full flow - string', () => {
    let code = 'let m;\n' +
    'function foo(x, y, z){\n' +
    'let a = x + 1;\n' +
    'let c = [1,2,3];\n' +
    'if(z + \'b\' == \'ab\'){\n' +
    'return x;\n' +
    '}\n' +
    'else if(c[1] == 2){\n' +
    'return z;\n' +
    '}\n' +
    '}\n';
    let input = '1,2,\'a\'';
    assert.deepEqual(substituteAndColor(code, input),
        ['let&nbspm;', 'function&nbspfoo(x,&nbspy,&nbspz){', '<span style="background-color:#50ff5d">if(z&nbsp+&nbsp\'b\'&nbsp==&nbsp\'ab\'){</span>',
            'return&nbspx;', '}', '<span style="background-color:#50ff5d">else&nbspif(2&nbsp==&nbsp2){</span>',
            'return&nbspz;', '}', '}', ''
        ]);
});
});

describe('Full flow test with parenthesis', () => { it('Full flow - parenthesis', () => {
    let code = 'function foo(x){\n' +
    'let a = x + 1;\n'+
    'let b = a * y;\n'+
    'let c;\n' +
    'c = 0;\n' +
    'while (a < z) {\n'+
    'c = a + b;\n' +
    'z = c * 2;\n' +
    '}\n' +
    'return z;\n'+
    '}';
    let input = '1';
    assert.deepEqual(substituteAndColor(code, input),
        ['function&nbspfoo(x){', 'while&nbsp(x&nbsp+&nbsp1&nbsp<&nbspz)&nbsp{',
            '}', 'return&nbsp(x&nbsp+&nbsp1&nbsp+&nbsp(x&nbsp+&nbsp1)&nbsp*&nbspy)&nbsp*&nbsp2;', '}', ''
        ]);
});
});



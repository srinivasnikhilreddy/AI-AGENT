import dotenv from 'dotenv';
dotenv.config(); //Security purpose

import Groq from 'groq-sdk'; //The Groq SDK (groq-sdk) is a JavaScript/Node.js library that provides an easy way to interact with Groq's AI models (like Llama 3, Mistral, Mixtral) using the Groq API.
import readlineSync from 'readline-sync'
import { SYSTEM_PROMPT } from './SYSTEM_PROMPT.js';
import { UserService } from './Services/Service.js';
import sql from 'mssql';
import { config } from './Services/Service.js';


const userService = new UserService();

const groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY // This is the default and can be omitted
});


// Tools
// Get ToDo List
async function getToDoList(){
    const todoList = await userService.getToDoList();
    if(Array.isArray(todoList) && todoList.length > 0){
        return todoList.map(item => `• ${item.todo} [${item.status}]`).join('\n');
    }else{
        return '⚠️ No ToDo items found.';
    }
}

// Insert ToDo Task
async function insertToDo(task){
    await userService.insertToDo(task);
    return `✅ todo "${task}" added successfully.`;
}

// Update Task Status
async function updateToDoStatus(input){
    const { task, status } = input;
    await userService.updateToDoStatus(task, status);
    return `✅ todo ${task} updated to status "${status}".`;
}

// Delete Task
async function deleteToDoByName(task){
    await userService.deleteToDoByName(task);
    return `🗑️ todo ${task} deleted successfully.`;
}

// Delete ToDo
async function deleteAllToDo(){
    await userService.deleteAllToDo();
    return `🗑️ Todo list has been deleted successfully.`;
}

// Get Task by ID
async function getToDoByName(task){
    const res = await userService.getToDoByName(task);
    if(res){
        return `🔍 Task: ${res.todo} [${res.status}]`;
    }else{
        return `⚠️ No todo found with task ${task}.`;
    }
}

// Get Tasks by Status
async function getToDoByStatus(status){
    const todoList = await userService.getToDoByStatus(status);
    if(Array.isArray(todoList) && todoList.length > 0){
        return todoList.map(item => `• ${item.todo} [${item.status}]`).join('\n');
    }else{
        return `⚠️ No todo found with status "${status}".`;
    }
}

const tools = {
    getToDoList,
    insertToDo,
    updateToDoStatus,
    deleteToDoByName,
    deleteAllToDo,
    getToDoByName,
    getToDoByStatus
};

// user Prompt from the std in
/*const messages = [{ role: 'system', content: SYSTEM_PROMPT}];

while(true)
{
    const userQuery = readlineSync.question('Bot: Tell me how can i help you?\n>');
    */
export async function handleAI(userQuery) {
    console.log("Processing AI Query:", userQuery);

    //Fetch ToDo list from DB before calling AI
    const pool = await sql.connect(config);
    const result = await pool.request().query(`SELECT * FROM todo`);
    const todoList = result.recordset.map(task => `${task.todo} [${task.status}]`).join("\n");

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];        
    const query = {
        type: 'user',
        user: userQuery,
        todo_list: todoList //AI gets full ToDo list!
    };
    messages.push({ role: 'user', content: JSON.stringify(query)});

    //Auto-Prompting
    while(true)
    {
        const chat = await groqClient.chat.completions.create({
            model: 'llama3-8b-8192',
            messages: messages,
            response_format: {type: 'json_object'},
        });

        const result = chat.choices[0].message.content;
        messages.push({role: 'assistant', content: result});

        console.log(`\n\n------------------START AI------------------`);
        console.log(result);
        console.log(`------------------END AI------------------\n\n`);

        const call = JSON.parse(result);
        if(call.type == "output"){
            console.log(`🤖 Bot: \n${call.output}`);
            return call.output;
        }else if(call.type == "action"){
            const fn = tools[call.function];
            if(typeof fn === 'function'){
                try{
                    const observation = await fn(call.input);
                    const obs = { type: "observation", observation };
                    messages.push({ role: 'assistant', content: JSON.stringify(obs) });
                }catch(error){
                    console.error("❌ SQL Error:", error.message);
                    messages.push({ role: 'assistant', content: JSON.stringify({ type: "output", output: `⚠️ Error adding task: ${error.message}` }) });
                }
            }
        }
    }
}


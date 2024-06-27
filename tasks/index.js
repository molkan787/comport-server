const { Central } = require('../central');
const { TcuSwitchoverPopulator } = require('./tcu-switchover-populator');

class TasksManager{

    /**
     * @typedef {import('../framework/task').Task} Task
     */

    /**
     * @private
     * @type {Task[]}
     */
    static tasks = null;

    /**
     * @private
     * @type {Map<string, Task>}
     */
    static tasksMap = null;

    static async InitAll(){
        const tasksList = [
            TcuSwitchoverPopulator
        ]
        this.tasksMap = new Map()
        this.tasks = tasksList.map(TaskClass => {
            const t = new TaskClass(Central)
            this.tasksMap.set(TaskClass.name, t)
            return t
        })
        await Promise.all(
            this.tasks.map(t => t.Init())
        )
    }

    static GetTaskInstanceByName(name){
        return this.tasksMap.get(name) || null
    }

}

module.exports = {
    TasksManager
}
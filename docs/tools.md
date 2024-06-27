# Tools
All functions like Security Algorithms, Compressions, Encryption... are structured as tools, But each type of tools is added differently

## Security Algorithms JARs
To add a JAR file with Security Algorithm as a tool;

### 1. Convert JAR files
The jar files from the manufacturer tools are libraries, to be executed (runned) we need to make them an executable program 

1. Open java project `SecurityAlgoWrapper` in ***IntelliJ IDEA*** IDE
2. Import the JAR file into project

    1. Click on `File > Project Structure > Modules`
    2. Remove the previous JAR (if present) by selecting it and click the little minus icon ( **-** ) (On the right section)
    3. Add the new JAR file by click the plus icon ( **+** ) (On the right section)
    4. Update code (file `src/App`), Replace the class name with the new one, in the example below current class name is 'EZS167_18_19_59_20181830011838', for new one you can check the the class name inside 'com.daimler.security.generated' of the new JAR using ***Java Decompiler app (JD)***
        
        1. Import statement (first line on the file)
            ```
            import com.daimler.security.generated.EZS167_18_19_59_20181830011838;
            ```
        2. Variable initilization (First line inside `LegacyCall()` function)
            ```
            private static void LegacyCall(String[] args){
                var algo = new EZS167_18_19_59_20181830011838();
                ...
                ...
            }
            ```
    5. Build the Executable JAR

        1. Click on `File > Project Structure > Artificats`
        2. On the right side remove current one "SecurityAlgoWrapper:jar" by selection it and clicking the minus icon ( **-** )
        3. Add new artificat by click the plus icon ( **+** ) (on the right section) than selection `JAR > From modules with Depenedencies`
        4. In the "Main Class" field click the folder icon and select `App` class than hit "OK"
        5. Confirm all dialog windows (hit "OK" and again "OK")
        6. In the App Menu (on top) click `Build > Build Artificats`, again click `Build` in the submenu popup

    6. Copy built JAR file into server app's resources

        1. Navigate to the output folder of the SecurityAlgoWrapper project `SecurityAlgoWrapper\out\artifacts\SecurityAlgoWrapper_jar`
        2. There should be only one jar file, Rename it to the following name `SecAlgo_<class-name>.jar`, for example using the previous class name `SecAlgo_EZS167_18_19_59_20181830011838.jar
        3. Copy the renamed JAR file to the following directory of the server app's `resources/programs`

### 2. Add the tool to the code
1. Open source code file `controllers/tools.js`
2. Navigate to the object property `Tools` (should be line 18)
3. Add new entry (line) using the JAR's class name
    ```
    '<class-name>-generatekey': this.t_GenericSecAlgo_GenerateKey,
    ```
    usign the example class name
     ```
    'EZS167_18_19_59_20181830011838-generatekey': this.t_GenericSecAlgo_GenerateKey,
    ```
    Make sure to change only the class name and leave everything else same.


That's it the Security Algorithm JAR File tool is ready and can be used by the `Flasher App`


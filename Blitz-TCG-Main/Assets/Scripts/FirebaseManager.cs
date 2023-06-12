using UnityEngine;
using UnityEngine.SceneManagement;
using System;
using System.Collections;
using Firebase;
using Firebase.Auth;
using Firebase.Database;
using TMPro;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEngine.UI;

public class FirebaseManager : MonoBehaviour
{
    public static FirebaseManager instance;

    //Other Variables
    private GameObject AuthUI;
    private GameObject RememberMe;

    //Firebase Variables
    [Header("Firebase")]
    public FirebaseAuth auth;
    public FirebaseUser user;
    [Space(5f)]

    //Login Variables
    [Header("Login References")]
    [SerializeField]
    private GameObject loginUI;
    [SerializeField]
    private GameObject registerUI;
    [SerializeField]
    private TMP_InputField loginEmail;
    [SerializeField]
    private TMP_InputField loginPassword;
    [SerializeField]
    private TMP_Text loginOutputTextError;
    [SerializeField]
    private TMP_Text loginOutputTextSuccess;
    [SerializeField]
    public GameObject loginAnimation;
    [SerializeField]
    private Button loginButton;
    [SerializeField]
    private Button registerLoginButton;
    [Space(5f)]

    //Register Variables
    [Header("Register References")]
    [SerializeField]
    public TMP_InputField registerUsername;
    [SerializeField]
    private TMP_InputField registerEmail;
    [SerializeField]
    private TMP_InputField registerPassword;
    [SerializeField]
    private TMP_InputField registerConfirmPassword;
    [SerializeField]
    private TMP_Text registerOutputText;
    [SerializeField]
    public GameObject registerAnimation;
    [SerializeField]
    private GameObject registerOutput;
    [SerializeField]
    private Button registerButton;
    [SerializeField]
    private Button backButton;
    [SerializeField]
    private BlockedWords blockedWords;
    [Space(5f)]

    //Friends List and Validation
    private string userID;
    private DatabaseReference dbReference;
    static readonly Regex usernameValidator = new Regex(@"^[-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz]+$");
    static readonly Regex emailValidator = new Regex("^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$");

    private void Awake()
    {
        AuthUI = GameObject.FindGameObjectWithTag("AuthUIManager"); //accesing a gameobject via tags, could pick something better
        RememberMe = GameObject.FindGameObjectWithTag("RememberMe");

        DontDestroyOnLoad(gameObject);
        if (instance == null)
        {
            instance = this;
        }
        else if (instance != this)
        {
            Destroy(instance.gameObject);
            instance = this;
        }
    }

    private void Start() //initializing firebase
    {

        FirebaseApp.CheckAndFixDependenciesAsync().ContinueWith(checkDependecyTask =>
        {
            var dependencyStatus = checkDependecyTask.Result;

            if (dependencyStatus == DependencyStatus.Available)
            {
                InitializeFirebase();
            }
            else
            {
                Debug.LogError($"Could not resolve all Firebase dependencies:  {dependencyStatus}");
            }
        });
    }

    private void Update() //navigating the main menu, this uses a counter system in the AuthUIManager script
    {    
        if (SceneManager.GetActiveScene() == SceneManager.GetSceneByName("Login_Reg"))
        {
            if (AuthUI.GetComponent<AuthUIManager>().loginInput > 1 && registerButton.enabled == true)
            {
                if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
                {
                    RegisterButton();
                }
            }
            if (AuthUI.GetComponent<AuthUIManager>().loginInput < 2 && loginButton.enabled == true)
            {
                if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
                {
                    LoginButton();
                }
            }
            if (AuthUI.GetComponent<AuthUIManager>().loginInput > 1 && Input.GetKeyDown(KeyCode.Escape) & backButton.enabled == true)
            {
                LoginScreen();
            }
        }
    }

    private void InitializeFirebase() //setting the various firebase variables
    {
       // FirebaseDatabase.DefaultInstance.SetPersistenceEnabled(false); //trying to disable caching to fix the firebase bug of finding usernames that don't exist

        auth = FirebaseAuth.DefaultInstance;

        auth.StateChanged += AuthStateChanged;
        AuthStateChanged(this, null);

        dbReference = FirebaseDatabase.DefaultInstance.RootReference; //could do a FirebaseApp.DefaultIntance.SetEditorDatabaseURL("link") right before this to make sure you point to the right database
    }

    private void AuthStateChanged(object sender, System.EventArgs eventargs)
    {
        if(auth.CurrentUser != user)
        { 
            bool signedIn = user != auth.CurrentUser && auth.CurrentUser != null;

            if (!signedIn && user != null) //keeping track of user who is signed in and signed out in the console
            {
                Debug.Log("Signed Out");
            }

            user = auth.CurrentUser;

            if (signedIn)
            {
                Debug.Log($"Signed In: {user.DisplayName}");
/*                auth.SignOut(); //to force a signout
                Debug.Log(user.UserId);*/
            }
        }
    }
    public void RegisterScreen()
    {
        loginUI.SetActive(false);
        loginEmail.text = "";
        loginPassword.text = "";
        registerUI.SetActive(true);
        registerUsername.Select();
        ClearOutputs();
    }
    public void LoginScreen()
    {
        registerUI.SetActive(false);
        registerUsername.text = "";
        registerEmail.text = "";
        registerPassword.text = "";
        registerConfirmPassword.text = "";
        loginUI.SetActive(true);
        loginEmail.Select();
    }
    public void ClearOutputs() //output clearning
    {
        loginOutputTextError.text = "";
        loginOutputTextSuccess.text = "";
        registerOutputText.text = "";
    }

    public void LoadingAnimationRegOn()
    {
        registerAnimation.SetActive(true); //loading screen
        registerUI.SetActive(false);

        registerButton.enabled = false;
        registerButton.interactable = false;

        backButton.enabled = false;
        backButton.interactable = false;
    }

    public void LoadingAnimationRegOff()
    {
        registerAnimation.SetActive(false);
        registerUI.SetActive(true);

        registerButton.enabled = true;
        registerButton.interactable = true;

        backButton.enabled = true;
        backButton.interactable = true;
    }

    public void LoadingAnimationLoginOn()
    {
        loginAnimation.SetActive(true); //loading screen
        loginUI.SetActive(false);

        loginButton.enabled = false;
        loginButton.interactable = false;

        registerLoginButton.enabled = false;
        registerLoginButton.interactable = false;
    }

    public void LoadingAnimationLoginOff()
    {
        loginAnimation.SetActive(false);
        loginUI.SetActive(true);

        loginButton.enabled = true;
        loginButton.interactable = true;

        registerLoginButton.enabled = true;
        registerLoginButton.interactable = true;
    }

    public void LoginButton() //starts login coroutine
    {
        StartCoroutine(LoginLogic(loginEmail.text, loginPassword.text));
    }

    public void RegisterButton() //starts first register coroutine
    {
        if (registerUsername.text == "")
        {
            registerOutputText.text = "Usename cannot be blank";
        }
        else
        {
            StartCoroutine(RegisterButtonEnumerator());
        }
    }
    IEnumerator RegisterButtonEnumerator() //starts the coroutine to see if a username already exists, this is likely where the issue is.
    {
        yield return StartCoroutine(CheckIfUsernameExists((string checkedUsername) =>
         {
           if (checkedUsername == "False") //if username is not in use, then start register coroutine
           {
                 RegistrationFieldCheck();
           }
           else if (checkedUsername == "Error") //for when firebase returns a json that contains just "{}" - unsure why this happens
           {
                 registerOutputText.text = "Unable to query firebase successfully, try again later";
           }
           else //if True, username is in use
           {
                 registerOutputText.text = "Username in use, choose a different username";
           }
         }));
    }
    IEnumerator CheckIfUsernameExists(Action<string> onCallback) //ensuring usernames are unique
    {
        //Debug.Log(user.UserId.ToString());
        var usernameCheck = FirebaseDatabase.DefaultInstance.GetReference("users").OrderByChild("username").EqualTo(registerUsername.text).GetValueAsync(); //this query is behaving strangely
        yield return new WaitUntil(predicate: () => usernameCheck.IsCompleted);

        DataSnapshot snapshotUsername = usernameCheck.Result;

        if (usernameCheck.Exception != null) //basic error checking, unsure if it actually does anything here of use
        {
            registerOutputText.text = "Error at CheckIfUsernameExists";
        }
        else
        {
            if (snapshotUsername.Exists) //if the json is not empty, then the username is in use
            {
                if (snapshotUsername.GetRawJsonValue().ToString() == "{}") //sometimes the jason is returning an empty bracket json when a username does not exist, should be returning nothing
                {
                    onCallback.Invoke("Error");
                }
                else
                {
                    onCallback.Invoke("True"); //if the username is in use, i.e. it was found, return true
                }

                Debug.Log("the raw json to string is " + snapshotUsername.GetRawJsonValue().ToString()); //debugging the returned value
                Debug.Log("the registerusername text is " + registerUsername.text);
            }
            else //if snapshotUsername does not exist, then no Json is returned, not even empty brackets, which means the username is not in use
            {
                onCallback.Invoke("False");
                Debug.Log("the registerusername text is " + registerUsername.text);
                //Debug.Log("the raw json to string is " + snapshotUsername.GetRawJsonValue().ToString()); //should throw a console error when working correctly (i.e. not exist)
            }
        }
    }

    private IEnumerator LoginLogic(string _email, string _password) //standard firebase login logic
    {
        LoadingAnimationLoginOn();
        yield return new WaitForSeconds(1); //mimicking a loading time

        Credential credential = EmailAuthProvider.GetCredential(_email, _password);
        var loginTask = auth.SignInWithCredentialAsync(credential);
        yield return new WaitUntil(predicate: () => loginTask.IsCompleted);

        if (loginTask.Exception != null)
        {
            FirebaseException firebaseException = (FirebaseException)loginTask.Exception.GetBaseException();
            AuthError error = (AuthError)firebaseException.ErrorCode;
            string output = "Unknown Error";

            switch (error)
            {
                case AuthError.MissingEmail:
                    output = "Missing Email";
                    break;
                case AuthError.MissingPassword:
                    output = "Missing Password";
                    break;
                case AuthError.WrongPassword:
                    output = "Wrong Password";
                    break;
                case AuthError.InvalidEmail:
                    output = "Invalid Email";
                    break;
                case AuthError.UserNotFound:
                    output = "User does not exist";
                    break;
                case AuthError.TooManyRequests:
                    output = "Timed out, too many requests";
                    break;
            }
            loginOutputTextSuccess.text = "";
            loginOutputTextError.text = output;
            LoadingAnimationLoginOff();
        }
        else
        {
            if (user.IsEmailVerified)
            {
                if (PlayerPrefs.HasKey("toggleOn") == false) //logic for playerprefs
                {
                    if (RememberMe.GetComponent<RememberMe>().rememberMeButtonOn.activeSelf)
                    {
                        PlayerPrefs.SetString("loginEmail", loginEmail.text);
                        PlayerPrefs.SetString("toggleOn", "1");
                        PlayerPrefs.Save();
                    }
                }

                if (PlayerPrefs.HasKey("toggleOn") == true)
                {
                    if (loginEmail.text != PlayerPrefs.GetString("loginEmail"))
                    {
                        PlayerPrefs.SetString("loginEmail", loginEmail.text);
                        PlayerPrefs.Save();
                    }

                    else if (!RememberMe.GetComponent<RememberMe>().rememberMeButtonOn.activeSelf)

                    {
                        PlayerPrefs.DeleteKey("loginEmail");
                        PlayerPrefs.DeleteKey("toggleOn");
                    }
                }


                StartCoroutine(ConcurrentUserCheck()); //makes sure user is not already logged in

            }
            else
            {
                LoadingAnimationLoginOff();
                loginOutputTextSuccess.text = "";
                loginOutputTextError.text = "Please verify your email";
            }
        }
    }

    public IEnumerator ConcurrentUserCheck()
    {
        var concurrent = FirebaseDatabase.DefaultInstance.GetReference("users").Child(user.UserId).Child("online").GetValueAsync();
        yield return new WaitUntil(predicate: () => concurrent.IsCompleted); //todo maybe add some exception checking
        if (concurrent.IsFaulted)
        {
            LoadingAnimationLoginOff();
            loginOutputTextSuccess.text = "";
            loginOutputTextError.text = "Unable to confirm if user is already logged in";
        }
        else if (concurrent.IsCompleted)
        {
            DataSnapshot concurrentData = concurrent.Result;

            //Debug.Log(concurrentData.Value.ToString());

            if (concurrentData.Value.ToString() == "T")
            {
                LoadingAnimationLoginOff();
                loginOutputTextSuccess.text = "";
                loginOutputTextError.text = "You are already logged in";
            }
            else
            {
                GameManager.instance.ChangeScene(1);
            }
        }
    }

    private void RegistrationFieldCheck()
    {
        if (registerUsername.text.Length > 12)
        {
            //If username is greater than 12 digits, then show warning
            registerOutputText.text = "Username must be less than 12 characters";
        }
        else if (blockedWords.blockedWordsList.Any(s => registerUsername.text.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0) == true) //checking for bad words
        {
            registerOutputText.text = "Inappropriate Username";
        }

        else if (!usernameValidator.IsMatch(registerUsername.text))
        {
            //validate against regex
            registerOutputText.text = "Usernames are alphanumeric and can contain '-' and '_'";
        }
        else if (registerEmail.text.Length > 64)
        {
            //Check to see if email length is reasonable
            registerOutputText.text = "Email address too long";
        }
        else if (!emailValidator.IsMatch(registerEmail.text.ToLower()))
        {
            //validates against the regex
            registerOutputText.text = "Invalid Email";
        }
        else if (registerPassword.text.Length < 8)
        {
            //If the password is less than 8 characters, then show warning
            registerOutputText.text = "Password must contain 8 characters";
        }
        else if (registerPassword.text.All(char.IsDigit))
        {
            //checks if the password is all int, if so throw error 
            registerOutputText.text = "Password must contain at least one letter";
        }
        else if (registerPassword.text.All(char.IsLetter))
        {
            //checks if the password is all letters, if so throw error
            registerOutputText.text = "Password must contain at least one number";
        }
        else if (registerPassword.text.All(char.IsLetterOrDigit))
        {
            //checks if the password is all letters and numbers, if so throw error
            registerOutputText.text = "Password must contain at least one symbol";
        }
        else if (registerPassword.text != registerConfirmPassword.text)
        {
            //If the password does not match show a warning
            registerOutputText.text = "Passwords do not match";
        }
        else
        {
            StartCoroutine(RegisterLogic(registerUsername.text, registerEmail.text, registerPassword.text));
        }
    }

    private IEnumerator RegisterLogic(string _username, string _email, string _password) //standard register logic with some initial checks
    {
            LoadingAnimationRegOn(); //shows a loading animation and disables buttons
            yield return new WaitForSeconds(1); //mimicking a loading time

            var registerTask = auth.CreateUserWithEmailAndPasswordAsync(_email, _password); //start the create user function if all checks were passed
            yield return new WaitUntil(predicate: () => registerTask.IsCompleted);

            if (registerTask.Exception != null)
            {
                //If there are errors, then handle them
                Debug.LogWarning($"Failed to register task with {registerTask.Exception}");
                FirebaseException firebaseException = (FirebaseException)registerTask.Exception.GetBaseException();
                AuthError error = (AuthError)firebaseException.ErrorCode;
                string output = "Unknown Error";

                switch (error) //some error checks are duplicative but do not hurt to have in incase someone gets around it
                {
                    case AuthError.MissingEmail:
                        output = "Missing Email";
                        break;
                    case AuthError.MissingPassword:
                        output = "Missing Password";
                        break;
                    case AuthError.WeakPassword:
                        output = "Weak Password";
                        break;
                    case AuthError.InvalidEmail:
                        output = "Invalid Email";
                        break;
                    case AuthError.EmailAlreadyInUse:
                        output = "Email already in use";
                        break;
                    case AuthError.TooManyRequests:
                        output = "Timed out, too many requests";
                        break;
                }
                registerOutputText.text = output;
                LoadingAnimationRegOff();
        }

            else //if there are no errors, then create the user - set their displayname and photo
            {

                UserProfile profile = new UserProfile
                {
                    DisplayName = _username,
                    //PhotoUrl = new System.Uri("https://i.imgur.com/wd0vE6l.png"),
                };

                var defaultUserTask = user.UpdateUserProfileAsync(profile);
                yield return new WaitUntil(predicate: () => defaultUserTask.IsCompleted);

                if(defaultUserTask.Exception != null) //check for errors
                {
                    user.DeleteAsync();

                    Debug.LogWarning($"Failed to register task with {defaultUserTask.Exception}");
                    FirebaseException firebaseException = (FirebaseException)defaultUserTask.Exception.GetBaseException();
                    AuthError error = (AuthError)firebaseException.ErrorCode;
                    string output = "Unknown Error";

                    switch (error)
                    {
                       case AuthError.Cancelled:
                                output = "Update user was cancelled";
                       break;
                       case AuthError.SessionExpired:
                       output = "Session expired";
                       break;
                    }
                    registerOutputText.text = output;
                    LoadingAnimationRegOff();
            }
                else
                {
                    CreateUserinRealtimeDatabase(); //send data to firebase realtime database, might be better as a coroutine

                    Debug.Log($"Firebase User Created Successfully: {user.DisplayName} ({user.UserId})"); //show info in console

                    StartCoroutine(SendVerifcationEmail()); //sendverification email if user was able to be created
                }
            }
    }
    private IEnumerator SendVerifcationEmail() //standard verification email logic
    {
        if (user != null)
        {
            var emailTask = user.SendEmailVerificationAsync();
            yield return new WaitUntil(predicate: () => emailTask.IsCompleted);

            if (emailTask.Exception != null)
            {
                Debug.LogWarning($"Failed to register task with {emailTask.Exception}");

                FirebaseException firebaseException = (FirebaseException)emailTask.Exception.GetBaseException();
                AuthError error = (AuthError)(firebaseException.ErrorCode);

                string output = "Unknown Error";
                switch (error)
                {
                    case AuthError.Cancelled:
                        output = "Verification Task was cancelled";
                        break;
                    case AuthError.InvalidRecipientEmail:
                        output = "Invalid Email";
                        break;
                    case AuthError.TooManyRequests:
                        output = "Too many requests, please wait";
                        break;
                }

                registerOutputText.text = output;
                LoadingAnimationRegOff();

            }
            else
            {
                Debug.Log($"Verification email sent to {user.Email}");
                StartCoroutine(ChangeUIAfterVerification());
            }
        }
    }

    IEnumerator ChangeUIAfterVerification()
    {
        LoadingAnimationRegOff();
        LoginScreen();
        yield return new WaitForEndOfFrame();
        loginOutputTextSuccess.text = "Verification email sent";
    }

    public void CreateUserinRealtimeDatabase() //sending data to realtime database
    {
        userID = user.UserId; //this is the auth userID
        Debug.Log(userID);
        ulong creationDate = auth.CurrentUser.Metadata.CreationTimestamp;
        UserLoginData UserLoginData = new UserLoginData(registerEmail.text, registerUsername.text,userID, "none", "default", "F", creationDate.ToString());
        string json = JsonUtility.ToJson(UserLoginData);
        dbReference.Child("users").Child(userID).SetRawJsonValueAsync(json);

/*        UserLoginStatus UserLoginStatus = new UserLoginStatus("F");
        string json2 = JsonUtility.ToJson(UserLoginStatus);
        dbReference.Child("onlineStatus").Child(userID).SetRawJsonValueAsync(json2);*/

    }

    public class UserLoginData //setting up data to be sent to firebase realtime database
    {
        public string email;
        public string username;
        public string userID;
        public string wallet;
        public string pfp;
        public string online;
        public string creationDate;

        public UserLoginData(string email, string username, string userID, string wallet, string pfp, string online, string creationDate)
        {
            this.email = email;
            this.username = username;
            this.userID = userID;
            this.wallet = wallet;
            this.pfp = pfp;
            this.online = online;
            this.creationDate = creationDate;
        }

    }

/*    public class UserLoginStatus //setting up data to be sent to firebase realtime database
    {
        public string online;

        public UserLoginStatus(string online)
        {
            this.online = online;
        }

    }*/
}

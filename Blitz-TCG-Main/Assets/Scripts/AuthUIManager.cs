using UnityEngine;
using TMPro;
using System.Collections;

public class AuthUIManager : MonoBehaviour
{

    //this script is used to control the cursor in the login/reg menus

    public static AuthUIManager instance;

    //Login Variables
    [Header("Login References")]
    [SerializeField]
    private TMP_InputField loginEmail; //0
    [SerializeField]
    private TMP_InputField loginPassword; //1
    [Space(5f)]

    //Register Variables
    [Header("Register References")]
    [SerializeField]
    private TMP_InputField registerUsername; //2
    [SerializeField]
    private TMP_InputField registerEmail; //3
    [SerializeField]
    private TMP_InputField registerPassword; //4
    [SerializeField]
    private TMP_InputField registerConfirmPassword; //5
    [Space(5f)]

    //Other Variables
    public int loginInput;

    private void Awake()
    {
        if (instance == null)
        {
            instance = this;
        }
        else if (instance != this)
        {
            Destroy(gameObject);
        }
    }
    private void Start()
    {
        //PlayerPrefs.DeleteAll(); //class.method

        if (PlayerPrefs.HasKey("toggleOn") == false)
        {
            loginEmail.Select();
        }
        else
        {
            loginPassword.Select();
        }

    }
    private void Update()
    {
        if (loginEmail.isFocused == false && loginInput == 0) //keep an eye on this coroutine content if login/reg breaks
        {
            StartCoroutine(ActivateLoginEmailInputField());
        }
        else if (loginPassword.isFocused == false && loginInput == 1)
        {
            StartCoroutine(ActivateLoginEmailInputField());
        }
        else if (registerUsername.isFocused == false && loginInput == 2)
        {
            StartCoroutine(ActivateLoginEmailInputField());
        }
        else if (registerEmail.isFocused == false && loginInput == 3)
        {
            StartCoroutine(ActivateLoginEmailInputField());
        }
        else if (registerPassword.isFocused == false && loginInput == 4)
        {
            StartCoroutine(ActivateLoginEmailInputField());
        }
        else if (registerConfirmPassword.isFocused == false && loginInput == 5)
        {
            StartCoroutine(ActivateLoginEmailInputField());
        }

        if (loginInput < 2 && Input.GetKeyDown(KeyCode.Tab))
        {
            loginInput++;
            if (loginInput > 1) loginInput = 0;
            SelectInputField();
        }

        else if (loginInput > 1 && Input.GetKeyDown(KeyCode.Tab))
        {
            loginInput++;
            if (loginInput > 5) loginInput = 2;
            SelectInputField();
        }

        void SelectInputField()
        {
            switch (loginInput)
            {
                case 0:
                    loginEmail.Select();
                    break;
                case 1:
                    loginPassword.Select();
                    break;
                case 2:
                    registerUsername.Select();
                    break;
                case 3:
                    registerEmail.Select();
                    break;
                case 4:
                    registerPassword.Select();
                    break;
                case 5:
                    registerConfirmPassword.Select();
                    break;
            }
        }
    }

    public void LoginEmailSelected() => loginInput = 0;
    public void LoginPasswordSelected() => loginInput = 1;
    public void RegisterUsernameSelected() => loginInput = 2;
    public void RegisterEmailSelected () => loginInput = 3;
    public void RegisterPasswordSelected() => loginInput = 4;
    public void RegisterConfirmPasswordSelected() => loginInput = 5;

    IEnumerator ActivateLoginEmailInputField() //keep an eye on this coroutine content if login/reg breaks
    {
        if (loginInput == 0)
        {
            yield return new WaitForEndOfFrame();
            loginEmail.ActivateInputField();
        }
        else if (loginInput == 1)
        {
            yield return new WaitForEndOfFrame();
            loginPassword.ActivateInputField();
        }
        else if (loginInput == 2)
        {
            yield return new WaitForEndOfFrame();
            registerUsername.ActivateInputField();
        }
        else if (loginInput == 3)
        {
            yield return new WaitForEndOfFrame();
            registerEmail.ActivateInputField();
        }
        else if (loginInput == 4)
        {
            yield return new WaitForEndOfFrame();
            registerPassword.ActivateInputField();
        }
        else if (loginInput == 5)
        {
            yield return new WaitForEndOfFrame();
            registerConfirmPassword.ActivateInputField();
        }
    }
}

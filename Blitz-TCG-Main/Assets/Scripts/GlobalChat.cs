using TMPro;
using UnityEngine;

public class GlobalChat : MonoBehaviour
{

    [Header("UI")]
    [SerializeField]
    private GameObject senderUserID; //to grab the user's username
    [SerializeField]
    private TMP_Text senderUserIDText; //to grab the user's userID behind the scenes for use later
    [SerializeField]
    public GameObject senderUsername;
    [SerializeField]
    public TMP_Text senderUsernameText;
    [SerializeField]
    private GameObject generalChatDropdown; //to grab the user's username


    public void SendValuesToMenu()
    {
        TMP_Text senderUsernameRaw = senderUsername.GetComponent<TMP_Text>();
        TMP_Text senderUserIDRaw = senderUserID.GetComponent<TMP_Text>();

        if (senderUsernameRaw.text != MainMenuUIManager.instance.username)
        {
            generalChatDropdown.SetActive(true);
            senderUserIDText.text = senderUserIDRaw.text; //this is moving the values from the prefab to the chat window tmp values
            senderUsernameText.text = senderUsernameRaw.text;
        }
        else if (senderUsernameRaw.text == MainMenuUIManager.instance.username)
        {
            MainMenuUIManager.instance.ClearUI();
            MainMenuUIManager.instance.messengerErorr.text = "You cannot message yourself";
        }
        else
        {
            MainMenuUIManager.instance.ClearUI();
            MainMenuUIManager.instance.messengerErorr.text = "Unknown Error, try again";
            Debug.Log("Error in WhisperChat script");
        }
    }
}

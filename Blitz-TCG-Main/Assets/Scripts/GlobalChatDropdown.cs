using System.Collections;
using TMPro;
using UnityEngine;
using Firebase.Database;

public class GlobalChatDropdown : MonoBehaviour
{
    [Header("UI")]
    [SerializeField]
    private TMP_Text senderUserIDText; //to grab the user's userID behind the scenes for use later
    [SerializeField]
    public TMP_Text senderUsernameText;
    [SerializeField]
    public GameObject generalChatDropdown; //to grab the user's username
    [SerializeField]
    private TMP_Text messageUserIDText; //to grab the user's userID behind the scenes for use later
    [SerializeField]
    public TMP_Text messageUsernameText;


    public void Close()
    {
        generalChatDropdown.SetActive(false);
    }

    public void Whisper()
    {
        messageUserIDText.text = senderUserIDText.text;

        if (MainMenuUIManager.instance.friendsListUsernames.Contains(senderUsernameText.text))
        {
            messageUsernameText.color = new Color32(86, 255, 0, 255);
        }
        else if (!MainMenuUIManager.instance.friendsListUsernames.Contains(senderUsernameText.text))
        {
            messageUsernameText.color = new Color32(250, 60, 214, 255);
        }
 
        messageUsernameText.text = "[" + senderUsernameText.text + "]";
        MainMenuUIManager.instance.ResizeChatInputField();
        MainMenuUIManager.instance.ClearUI();
        MainMenuUIManager.instance.messengerInputField.Select();
        generalChatDropdown.SetActive(false);
    }

    public void Block()
    {
        MainMenuUIManager.instance.ClearUI();

        if (senderUsernameText.text == "") //check if entered name is blank, if blank then throw output message
        {
            MainMenuUIManager.instance.messengerErorr.text = "Message cannot be blank";
            generalChatDropdown.SetActive(false);
        }
        else if (MainMenuUIManager.instance.blockedListUsernames.Count >= 200)
        {
            MainMenuUIManager.instance.messengerErorr.text = "You cannot block anymore users";
            generalChatDropdown.SetActive(false);
        }
        else if (MainMenuUIManager.instance.friendsListUsernames.Contains(senderUsernameText.text)) //just in case a message slips through
        {
            MainMenuUIManager.instance.messengerErorr.text = senderUsernameText.text + " is a friend";
            generalChatDropdown.SetActive(false);
        }
        else if (MainMenuUIManager.instance.blockedListUsernames.Contains(senderUsernameText.text))
        {
            MainMenuUIManager.instance.messengerErorr.text = senderUsernameText.text + " is already blocked";
            generalChatDropdown.SetActive(false);
        }
        else
        {
            StartCoroutine(BlockEnumerator()); //if text has been entered, begin firebase search
        }

    }

    public IEnumerator BlockEnumerator()
    {
        var friendBlock = FirebaseDatabase.DefaultInstance.RootReference.Child("blocked").Child(MainMenuUIManager.instance.userID).Child(senderUsernameText.text).SetValueAsync(senderUserIDText.text);
        yield return new WaitUntil(predicate: () => friendBlock.IsCompleted); //todo add check for failure

        if (friendBlock.IsFaulted)
        {
            Debug.Log(friendBlock.Exception.ToString());
            MainMenuUIManager.instance.messengerErorr.text = "Error blocking the user";
            generalChatDropdown.SetActive(false);
        }
        else if (friendBlock.IsCompleted)
        {
            MainMenuUIManager.instance.blockedListUserIDs.Add(senderUserIDText.text); ///add the key of the found childs to the list. These are the usernames of their friends
            MainMenuUIManager.instance.blockedListUsernames.Add(senderUsernameText.text);

            MainMenuUIManager.instance.messengerSuccess.text = senderUsernameText.text + " has been blocked";
            generalChatDropdown.SetActive(false);
        }
    }

    public void Add()
    {
        MainMenuUIManager.instance.ClearUI();

        if (senderUsernameText.text == "") //check if entered name is blank, if blank then throw output message
        {
            MainMenuUIManager.instance.messengerErorr.text = "Message cannot be blank";
            generalChatDropdown.SetActive(false);
        }
        else if (MainMenuUIManager.instance.friendsListUsernames.Count >= 50)
        {
            MainMenuUIManager.instance.messengerErorr.text = "You cannot add anymore friends";
            generalChatDropdown.SetActive(false);
        }
        else if (MainMenuUIManager.instance.blockedListUsernames.Contains(senderUsernameText.text)) //just in case a message slips through
        {
            MainMenuUIManager.instance.messengerErorr.text = senderUsernameText.text + " is blocked";
            generalChatDropdown.SetActive(false);
        }
        else if (MainMenuUIManager.instance.friendsListUsernames.Contains(senderUsernameText.text))
        {
            MainMenuUIManager.instance.messengerErorr.text = senderUsernameText.text + " is already added"; ;
            generalChatDropdown.SetActive(false);
        }
        else
        {
            StartCoroutine(AddEnumerator()); //if text has been entered, begin firebase search
        }
    }

    public IEnumerator AddEnumerator()
    {
        var friendAdd = FirebaseDatabase.DefaultInstance.RootReference.Child("friends").Child(MainMenuUIManager.instance.userID).Child(senderUsernameText.text).SetValueAsync(senderUserIDText.text);
        yield return new WaitUntil(predicate: () => friendAdd.IsCompleted); //todo add check for failure

        if (friendAdd.IsFaulted)
        {
            Debug.Log(friendAdd.Exception.ToString());
            MainMenuUIManager.instance.messengerErorr.text = "Error adding the user";
            generalChatDropdown.SetActive(false);
        }
        else if (friendAdd.IsCompleted)
        {
            MainMenuUIManager.instance.friendsListUserIDs.Add(senderUserIDText.text); ///add the key of the found childs to the list. These are the usernames of their friends
            MainMenuUIManager.instance.friendsListUsernames.Add(senderUsernameText.text);

            if (MainMenuUIManager.instance.messengerFriendUsername.text.Replace("[", "").Replace("]", "") == senderUsernameText.text)
            {
                MainMenuUIManager.instance.messengerFriendUsername.color = new Color32(86, 255, 0, 255);
            }

            MainMenuUIManager.instance.messengerSuccess.text = senderUsernameText.text + " has been added";
            generalChatDropdown.SetActive(false);
        }
    }

}

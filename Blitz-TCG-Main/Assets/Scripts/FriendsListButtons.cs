using UnityEngine;
using TMPro;

public class FriendsListButtons : MonoBehaviour //this script is attached to the "ItemPrefab/TitleText" GameObject in the project
{
    public static FriendsListButtons instance;

    [Header("UI")]
    [SerializeField]
    private GameObject TitleText; //to grab the user's username
    [SerializeField]
    private GameObject userIDText; //to grab the user's userID behind the scenes for use later
    [SerializeField]
    private GameObject friendsDropdown;
    [SerializeField]
    public TMP_Text friendUsername;
    [SerializeField]
    public TMP_Text friendUserID;


    public void OpenDropdown()
    {

        if (friendsDropdown.activeSelf)
        {
            friendsDropdown.SetActive(false);
        }
        else if (!friendsDropdown.activeSelf)
        {
            friendsDropdown.SetActive(true);
        }

    }

    public void Whisper()
    {
        TMP_Text friendUsernameRaw = TitleText.GetComponent<TMP_Text>();
        TMP_Text friendUserIDRaw = userIDText.GetComponent<TMP_Text>();


        if (MainMenuUIManager.instance.friendsListUsernames.Contains(friendUsernameRaw.text))
        {
            friendUsername.color = new Color32(86, 255, 0, 255);
        }
        else if (!MainMenuUIManager.instance.friendsListUsernames.Contains(friendUsernameRaw.text))
        {
            friendUsername.color = new Color32(250, 60, 214, 255);
        }

        friendUsername.text = "[" + friendUsernameRaw.text + "]";
        friendUserID.text = friendUserIDRaw.text;
        MainMenuUIManager.instance.ResizeChatInputField();

        friendsDropdown.SetActive(false);
        MainMenuUIManager.instance.friendsAddSearch.SetActive(false);
        MainMenuUIManager.instance.friendsRemoveSearch.SetActive(false);
        MainMenuUIManager.instance.friendsUI.SetActive(false);
        MainMenuUIManager.instance.ClearUI();
        MainMenuUIManager.instance.messengerInputField.Select();
    }

    public void Remove()
    {
        TMP_Text friendUsernameRaw = TitleText.GetComponent<TMP_Text>();
        friendsDropdown.SetActive(false);
        MainMenuUIManager.instance.friendsAddSearch.SetActive(false);
        MainMenuUIManager.instance.friendsRemoveSearch.SetActive(true);
        MainMenuUIManager.instance.friendsRemoveInputField.text = friendUsernameRaw.text;
        MainMenuUIManager.instance.friendsRemoveInputField.Select();

    }

}

using TMPro;
using UnityEngine;

public class FriendsBlockedButtons : MonoBehaviour
{
    [Header("UI")]
    [SerializeField]
    private GameObject TitleText; //to grab the user's username
    [SerializeField]
    private GameObject blockedDropdown;

    public void OpenDrowndown()
    {

        if (blockedDropdown.activeSelf)
        {
            blockedDropdown.SetActive(false);
        }
        else if (!blockedDropdown.activeSelf)
        {
            blockedDropdown.SetActive(true);
        }

    }
    public void Remove()
    {
        TMP_Text friendUsernameRaw = TitleText.GetComponent<TMP_Text>();
        blockedDropdown.SetActive(false);
        MainMenuUIManager.instance.friendsBlockAddSearch.SetActive(false);
        MainMenuUIManager.instance.friendsBlockRemoveSearch.SetActive(true);
        MainMenuUIManager.instance.friendsBlockRemoveInputField.text = friendUsernameRaw.text;
        MainMenuUIManager.instance.friendsBlockRemoveInputField.Select();

    }
}

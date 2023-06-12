using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class FriendsOnlineStatus : MonoBehaviour
{

    [Header("Storage")]
    [SerializeField]
    private TMP_Text statusText;
    [SerializeField]
    private TMP_Text pfpText;
    [Space(5f)]

    [Header("UI")]
    [SerializeField]
    private GameObject online;
    [SerializeField]
    private GameObject offline;
    [Space(5f)]

    [Header("PFP")]
    [SerializeField]
    private GameObject pfpUI;

    // Start is called before the first frame update

    void Start()
    {
        if (statusText.text == "F")
        {
            online.SetActive(false);
            offline.SetActive(true);
        }
        else if (statusText.text == "T")
        {
            online.SetActive(true);
            offline.SetActive(false);
        }


        if (pfpText.text == "Abyss")
        {
            pfpUI.GetComponent<RawImage>().texture = MainMenuUIManager.instance.pfpAbyss.GetComponent<RawImage>().texture;
        }
        else if (pfpText.text == "Margo")
        {
            pfpUI.GetComponent<RawImage>().texture = MainMenuUIManager.instance.pfpMargo.GetComponent<RawImage>().texture;
        }
        else if (pfpText.text == "Mios")
        {
            pfpUI.GetComponent<RawImage>().texture = MainMenuUIManager.instance.pfpMios.GetComponent<RawImage>().texture;
        }
        else if (pfpText.text == "Nasse")
        {
            pfpUI.GetComponent<RawImage>().texture = MainMenuUIManager.instance.pfpNasse.GetComponent<RawImage>().texture;
        }
        else
        {
            pfpUI.GetComponent<RawImage>().texture = MainMenuUIManager.instance.pfpDefault.GetComponent<RawImage>().texture;
        }

    }

}

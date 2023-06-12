using UnityEngine;
using System.Collections.Generic;

public class BlockedWordsMessage : MonoBehaviour
{
    public static BlockedWordsMessage instance;
    public List<string> blockedWordsMessenger = new List<string>();

    private void Awake()
    {
        DontDestroyOnLoad(gameObject);

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
        blockedWordsMessenger.Add("faggot");
        blockedWordsMessenger.Add("nigger");
        blockedWordsMessenger.Add("niglet");
        blockedWordsMessenger.Add("chink");
        blockedWordsMessenger.Add("dothead");
        blockedWordsMessenger.Add("gringo");
        blockedWordsMessenger.Add("wetback");
        blockedWordsMessenger.Add("raghead");
        blockedWordsMessenger.Add("redskin");
    }
}

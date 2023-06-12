using UnityEngine;

public class DontDestroy : MonoBehaviour
{

    //Other Variables
    public static DontDestroy instance;

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
}

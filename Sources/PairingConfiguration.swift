import Foundation
import Security

enum PairingConfiguration {
    static func loadToken(at dataRoot:URL) throws -> String {
        let fileManager=FileManager.default
        try fileManager.createDirectory(at:dataRoot,withIntermediateDirectories:true,attributes:[.posixPermissions:0o700])
        let path=dataRoot.appendingPathComponent("config.json")
        var config:[String:Any]=[:]
        if fileManager.fileExists(atPath:path.path) {
            config = try JSONSerialization.jsonObject(with:Data(contentsOf:path)) as? [String:Any] ?? [:]
        }
        if let saved=config["token"] as? String, !saved.isEmpty { return saved }
        var bytes=[UInt8](repeating:0,count:32)
        guard SecRandomCopyBytes(kSecRandomDefault,bytes.count,&bytes)==errSecSuccess else {
            throw NSError(domain:"MiMoPairing",code:1,userInfo:[NSLocalizedDescriptionKey:"无法生成配对码"])
        }
        let fresh=Data(bytes).base64EncodedString().replacingOccurrences(of:"+",with:"-").replacingOccurrences(of:"/",with:"_").replacingOccurrences(of:"=",with:"")
        config["token"]=fresh
        try JSONSerialization.data(withJSONObject:config).write(to:path,options:.atomic)
        try fileManager.setAttributes([.posixPermissions:0o600],ofItemAtPath:path.path)
        return fresh
    }
}

module.exports = (sequelize, DataTypes) => (
    sequelize.define('user', {
        email: {
            type: DataTypes.STRING(40),
            allowNull: true,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        nick: {//닉네임
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        provider: {
            //provider가 카카오면 카카오로 로그인 했다는 것 // local 이면 개발자가 만든 
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'local',
        },
        secret: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        dataURL: {
            type: DataTypes.TEXT(), 
            allowNull: true,
        },
        otpURL: {
            type: DataTypes.TEXT(),
            allowNull: true,
        },

    }, {
            timestamps: true, //sequelize 가 저절로 수정일과 로우 생성일 기록
            paranoid: true, //삭제일 기록- 데이터 복구할 수 있다.
        })
);